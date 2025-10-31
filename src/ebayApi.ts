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

  const tokenResponse = await ebayAuthToken.getApplicationToken('PRODUCTION');
  const token = JSON.parse(tokenResponse);

  appTokenCache = {
    token: token.access_token,
    expiresAt: now + token.expires_in * 1000,
  };

  return appTokenCache.token!;
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
    // Reverted to the logic that is proven to work for the Browse API.
    const ebayApi = new eBayApi({ 
        appId: process.env.EBAY_CLIENT_ID!,
        certId: process.env.EBAY_CLIENT_SECRET!, // This is incorrect but required by the broken library types.
        devId: 'dummy',
        sandbox: false 
    });
    const authToken = await getEbayAppToken();
    ebayApi.OAuth2.setCredentials(authToken);

    const response = await ebayApi.buy.browse.search({
        q: keyword,
        limit: EBAY_SEARCH_LIMIT,
        filter: config.filter,
    });

    const items = response.itemSummaries || [];
    return items.map((item: any) => mapToEbayItem(item, 'Browse'));
}

async function searchCompletedItems(keyword: string, config: FindingApiConfig): Promise<EbayItem[]> {
    // This function is temporarily disabled to allow the app to run.
    // It will be fixed correctly after studying the documentation.
    console.error('searchCompletedItems is not yet implemented correctly.');
    return [];
}

// --- MAIN EXPORT ---

export async function searchItemsByKeyword(
  keyword: string,
  configKey: string
): Promise<EbayItem[]> {
  const searchConfig = getEbaySearchConfig(configKey);

  if (configKey === 'ACTIVE') {
    return searchActiveItems(keyword, searchConfig as BrowseApiConfig);
  } else {
    return searchCompletedItems(keyword, searchConfig as FindingApiConfig);
  }
}
