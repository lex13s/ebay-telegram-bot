import eBayApi from 'ebay-api';
import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { EBAY_SEARCH_LIMIT, TOKEN_EXPIRATION_BUFFER } from './constants';
import { EbayItem } from './types/ebay-api';
import { getEbaySearchConfig, BrowseApiConfig, FindingApiConfig } from './ebaySearchConfig';

// --- AUTHENTICATION (FOR BROWSE API ONLY) ---
let appTokenCache = {
  token: null as string | null,
  expiresAt: 0,
};

let ebayAuthTokenInstance: EbayAuthToken | null = null;
let tokenRequestPromise: Promise<string> | null = null; // To handle in-flight requests

function getEbayAuthTokenInstance(): EbayAuthToken {
  if (!ebayAuthTokenInstance) {
    ebayAuthTokenInstance = new EbayAuthToken({
      clientId: process.env.EBAY_CLIENT_ID!,
      clientSecret: process.env.EBAY_CLIENT_SECRET!,
    });
  }
  return ebayAuthTokenInstance;
}

async function getEbayAppToken(): Promise<string> {
  const now = Date.now();
  if (appTokenCache.token && now < appTokenCache.expiresAt - TOKEN_EXPIRATION_BUFFER) {
    return appTokenCache.token;
  }

  if (tokenRequestPromise) {
    return tokenRequestPromise;
  }

  tokenRequestPromise = (async () => {
    try {
      const ebayAuthToken = getEbayAuthTokenInstance();
      const tokenResponse = await ebayAuthToken.getApplicationToken('PRODUCTION');
      const token = JSON.parse(tokenResponse);

      appTokenCache = {
        token: token.access_token,
        expiresAt: Date.now() + token.expires_in * 1000,
      };

      const ebayApi = getEbayApiInstance();
      ebayApi.OAuth2.setCredentials(appTokenCache.token!);

      return appTokenCache.token!;
    } catch (error) {
      throw new Error('Failed to get eBay application token.');
    } finally {
      tokenRequestPromise = null;
    }
  })();

  return tokenRequestPromise;
}

// --- EBAY API INSTANCE (SINGLETON) ---
let ebayApiInstance: eBayApi | null = null;

export function getEbayApiInstance(): eBayApi {
  if (!ebayApiInstance) {
    ebayApiInstance = new eBayApi({
      appId: process.env.EBAY_CLIENT_ID!,
      certId: process.env.EBAY_CLIENT_SECRET!,
      devId: 'dummy',
      sandbox: false,
    });
  }
  return ebayApiInstance;
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
async function searchActiveItems(keyword: string, config: BrowseApiConfig): Promise<EbayItem[]> {
    try {
        const ebayApi = getEbayApiInstance();
        await getEbayAppToken(); // Ensures token is fetched and credentials are set

        const response = await ebayApi.buy.browse.search({
            q: keyword,
            limit: EBAY_SEARCH_LIMIT,
            filter: config.filter,
        });

        const items = response.itemSummaries || [];
        return items.map((item: any) => mapToEbayItem(item, 'Browse'));
    } catch (error) {
        return [];
    }
}

async function searchCompletedItems(keyword: string, config: FindingApiConfig): Promise<EbayItem[]> {
    try {
        const ebayApi = getEbayApiInstance();
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
        return [];
    }
}

export async function searchItemsByKeyword(
  keywords: string[],
  configKey: string
): Promise<EbayItem[][]> {
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
    return keywords.map(() => []);
  }
}
