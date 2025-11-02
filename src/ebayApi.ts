import eBayApi from 'ebay-api';
import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { EBAY_SEARCH_LIMIT, TOKEN_EXPIRATION_BUFFER } from './constants';
import { EbayItem } from './types/ebay-api';
import { getEbaySearchConfig, BrowseApiConfig, FindingApiConfig } from './ebaySearchConfig';

// --- AUTHENTICATION (FOR BROWSE API ONLY) ---
// This logic is used ONLY for the Browse API (searchActiveItems) because it works.
let appTokenCache = {
  token: null as string | null,
  expiresAt: 0,
};

async function getEbayAppToken(): Promise<string> {
  const now = Date.now();
  if (appTokenCache.token && now < appTokenCache.expiresAt - TOKEN_EXPIRATION_BUFFER) {
    return appTokenCache.token;
  }

  const ebayAuthToken = new EbayAuthToken({
    clientId: process.env.EBAY_CLIENT_ID!,
    clientSecret: process.env.EBAY_CLIENT_SECRET!,
  });

  try {
    const tokenResponse = await ebayAuthToken.getApplicationToken('PRODUCTION');
    const token = JSON.parse(tokenResponse);

    appTokenCache = {
      token: token.access_token,
      expiresAt: now + token.expires_in * 1000,
    };

    return appTokenCache.token!;
  } catch (error) {
    console.error('Error fetching eBay application token:', error);
    throw new Error('Failed to get eBay application token.');
  }
}

// --- UNIFIED & SAFE ITEM MAPPER ---
function mapToEbayItem(rawItem: any, apiType: 'Browse' | 'Finding'): EbayItem {
    if (apiType === 'Browse') {
        return {
            itemId: rawItem.itemId ?? 'N/A',
            title: rawItem.title ?? 'No Title',
            price: {
                value: rawItem.price?.value ?? '0',
                currency: rawItem.price?.currency ?? 'N/A',
            },
        };
    }
    // apiType === 'Finding'
    return {
        itemId: rawItem.itemId ?? 'N/A',
        title: rawItem.title ?? 'No Title',
        price: {
            value: rawItem.sellingStatus?.currentPrice?.value?.toString() ?? '0',
            currency: rawItem.sellingStatus?.currentPrice?.currencyId ?? 'N/A',
        },
    };
}

// --- API CALLS (ISOLATED) ---

// Initialize eBayApi instance once at the module level
const ebayApi = new eBayApi({
    appId: process.env.EBAY_CLIENT_ID!,
    certId: process.env.EBAY_CLIENT_SECRET!, // This is incorrect but required by the broken library types.
    devId: 'dummy',
    sandbox: false
});

async function searchActiveItems(keyword: string, config: BrowseApiConfig): Promise<EbayItem[]> {
    try {
        const authToken = await getEbayAppToken();
        ebayApi.OAuth2.setCredentials(authToken);

        const response = await ebayApi.buy.browse.search({
            q: keyword,
            limit: EBAY_SEARCH_LIMIT,
            filter: config.filter,
            ...(config.sort ? { sort: config.sort } : {}),
        });

        const items = response.itemSummaries || [];
        return items.map((item: any) => mapToEbayItem(item, 'Browse'));
    } catch (error) {
        console.error(`Error searching active items for keyword '${keyword}':`, error);
        return []; // Возвращаем пустой массив в случае ошибки
    }
}

// Simple in-memory cache for Finding API responses to reduce repeated calls
const findingCache: Map<string, { expiry: number; items: any[] }> = new Map();
const FINDING_CACHE_TTL_MS = Number.parseInt(process.env.FINDING_CACHE_TTL_MS || '600000', 10) || 600000;

async function searchCompletedItems(keyword: string, config: FindingApiConfig): Promise<EbayItem[]> {
    // Choose primary marketplace: env override or heuristic (Motors for auto-like part numbers)
    const autoPartPattern = /[A-Za-z0-9]+-[A-Za-z0-9-]+/;
    const primaryGlobalId = (process.env.FINDING_GLOBAL_ID_LIST?.split(',').map(s => s.trim()).filter(Boolean)[0])
      || process.env.FINDING_GLOBAL_ID
      || (autoPartPattern.test(String(keyword)) ? 'EBAY-MOTOR' : 'EBAY-US');

    const DEBUG = process.env.DEBUG_EBAY_FINDING === '1' || process.env.DEBUG_EBAY_FINDING === 'true';

    const isRateLimitError = (err: any) => {
        const text = [err?.meta?.message, err?.firstError?.message, err?.message].filter(Boolean).join(' ');
        return /RateLimiter|exceeded the number of times/i.test(text);
    };

    try {
        // Build itemFilter (string values)
        const itemFilterBase = (config.itemFilter || []).map(({ name, value }) => ({
            name,
            value: Array.isArray(value) ? value.map(v => String(v)) : String(value),
        }));
        const itemFilter: Array<{ name: string; value: string }> = [...itemFilterBase as any];
        if (!itemFilter.some(f => f.name === 'EndTimeFrom')) {
            const ninetyDaysAgoISO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
            itemFilter.push({ name: 'EndTimeFrom', value: ninetyDaysAgoISO });
        }
        if (!itemFilter.some(f => f.name === 'EndTimeTo')) {
            itemFilter.push({ name: 'EndTimeTo', value: new Date().toISOString() });
        }
        if (!itemFilter.some(f => f.name === 'HideDuplicateItems')) {
            itemFilter.push({ name: 'HideDuplicateItems', value: 'true' });
        }

        const entriesPerPageNum = Number.parseInt(String(EBAY_SEARCH_LIMIT), 10);
        const baseKeyword = String(keyword || '').trim();
        const params: any = {
            keywords: baseKeyword,
            itemFilter,
            paginationInput: {
                entriesPerPage: Number.isFinite(entriesPerPageNum) && entriesPerPageNum > 0 ? entriesPerPageNum : 1,
                pageNumber: 1,
            },
            ...(config.sortOrder ? { sortOrder: config.sortOrder } : {}),
        };

        if (DEBUG) console.log(`[FindingAPI][REQ][${primaryGlobalId}] kw=${baseKeyword}`, JSON.stringify(params));
        const resp = await ebayApi.finding.findCompletedItems(params, {
            headers: { 'X-EBAY-SOA-GLOBAL-ID': primaryGlobalId }
        });
        const items = resp?.searchResult?.item || [];
        if (DEBUG) console.log(`[FindingAPI][RESP][${primaryGlobalId}] kw=${baseKeyword}: ${items.length} items`);
        return items.map((it: any) => mapToEbayItem(it, 'Finding'));
    } catch (err: any) {
        if (isRateLimitError(err)) {
            if (DEBUG) console.warn(`[FindingAPI][RATE_LIMIT][${primaryGlobalId}] kw=${keyword}`);
            const e = new Error('EBAY_RATE_LIMIT');
            (e as any).cause = err;
            throw e;
        }
        if (DEBUG) console.warn(`[FindingAPI][ERR][${primaryGlobalId}] kw=${keyword}:`, err?.message || err);
        return [];
    }
}

// --- MAIN EXPORT ---

export async function searchItemsByKeyword(
  keywords: string[],
  configKey: string
): Promise<EbayItem[][]> {
  const searchConfig = getEbaySearchConfig(configKey);

  if (configKey === 'ACTIVE') {
    const promises = keywords.map(keyword => searchActiveItems(keyword, searchConfig as BrowseApiConfig));
    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error in Promise.all for searchItemsByKeyword (ACTIVE):', error);
      return keywords.map(() => []);
    }
  }

  const results: EbayItem[][] = [];
  for (const keyword of keywords) {
    try {
      const arr = await searchCompletedItems(keyword, searchConfig as FindingApiConfig);
      results.push(arr);
    } catch (e: any) {
      if (typeof e?.message === 'string' && e.message.startsWith('EBAY_RATE_LIMIT')) {
        // Propagate rate limit so caller (findItem/bot) can display proper message and avoid charging
        throw e;
      }
      console.error('Error searching completed keyword:', keyword, e);
      results.push([]);
    }
  }
  return results;
}
