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

        console.time(`eBay Browse API Search for ${keyword}`);
        const response = await ebayApi.buy.browse.search({
            q: keyword,
            limit: EBAY_SEARCH_LIMIT,
            filter: config.filter,
        });
        console.timeEnd(`eBay Browse API Search for ${keyword}`);

        const items = response.itemSummaries || [];
        return items.map((item: any) => mapToEbayItem(item, 'Browse'));
    } catch (error) {
        console.error(`Error searching active items for keyword \'${keyword}\':`, error);
        return []; // Возвращаем пустой массив в случае ошибки
    }
}

async function searchCompletedItems(keyword: string, config: FindingApiConfig): Promise<EbayItem[]> {
    try {
        // Reusing the module-level ebayApi instance
        // For Finding API, authentication might be different or not required in the same way as Browse API.
        // Assuming it uses the same app token or handles its own auth internally if not set.
        // If Finding API also needs the app token, the setCredentials call should be here as well.
        // For now, keeping it as is, assuming it works without explicit setCredentials for Finding API if it's not Browse.

        const requestParams: any = {
            keywords: keyword,
            itemFilter: config.itemFilter,
            outputSelector: ['AspectHistogram'],
            paginationInput: {
                entriesPerPage: EBAY_SEARCH_LIMIT,
                pageNumber: 1,
            },
        };

        if (config.sortOrder) {
            requestParams.sortOrder = config.sortOrder;
        }

        const response = await ebayApi.finding.findCompletedItems(requestParams);

        const items = response.searchResult?.item || [];
        return items.map((item: any) => mapToEbayItem(item, 'Finding'));
    } catch (error) {
        console.error(`Error searching completed items for keyword \'${keyword}\':`, error);
        return []; // Возвращаем пустой массив в случае ошибки
    }
}

// --- MAIN EXPORT ---

export async function searchItemsByKeyword(
  keywords: string[], // Изменено на массив строк
  configKey: string
): Promise<EbayItem[][]> { // Изменено на массив массивов EbayItem
  const searchConfig = getEbaySearchConfig(configKey);

  const promises = keywords.map(keyword => {
    if (configKey === 'ACTIVE') {
      return searchActiveItems(keyword, searchConfig as BrowseApiConfig);
    } else {
      return searchCompletedItems(keyword, searchConfig as FindingApiConfig);
    }
  });

  try {
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error in Promise.all for searchItemsByKeyword:', error);
    // Если Promise.all отклоняется, это означает, что один из промисов отклонился.
    // Поскольку searchActiveItems/searchCompletedItems уже возвращают [],
    // это может произойти только если что-то пошло не так с самим Promise.all или map.
    return keywords.map(() => []); // Возвращаем массив пустых массивов для каждого ключевого слова
  }
}
