import eBayApi from 'ebay-api';
import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { EBAY_SEARCH_LIMIT, TOKEN_EXPIRATION_BUFFER } from './constants';
import { EbayItem } from './types/ebay-api';
import { getEbaySearchConfig, BrowseApiConfig, InsightsApiConfig } from './ebaySearchConfig';

// --- AUTHENTICATION (BUY APIs) ---
// Поддерживаем кэш токенов по ключу scope (для Browse и Insights могут отличаться скоупы)
const appTokenCache: Record<string, { token: string; expiresAt: number }> = {};

async function getEbayAppToken(scopesKey: string = 'default', scopes?: string[] | string): Promise<string> {
  const now = Date.now();
  const cached = appTokenCache[scopesKey];
  if (cached && now < cached.expiresAt - TOKEN_EXPIRATION_BUFFER) {
    return cached.token;
  }

  const ebayAuthToken = new EbayAuthToken({
    clientId: process.env.EBAY_CLIENT_ID!,
    clientSecret: process.env.EBAY_CLIENT_SECRET!,
  });

  try {
    const scopeParam = Array.isArray(scopes) ? scopes.join(' ') : scopes;
    // библиотека ожидает строку JSON в ответе
    const tokenResponse = await (scopeParam
      ? (ebayAuthToken as any).getApplicationToken('PRODUCTION', scopeParam)
      : ebayAuthToken.getApplicationToken('PRODUCTION'));
    const token = JSON.parse(tokenResponse);

    appTokenCache[scopesKey] = {
      token: token.access_token,
      expiresAt: now + token.expires_in * 1000,
    };

    return appTokenCache[scopesKey].token;
  } catch (error) {
    console.error('Error fetching eBay application token:', error);
    throw new Error('Failed to get eBay application token.');
  }
}

async function getAppTokenForScope(scopeKey: string, scopeStr: string): Promise<string> {
  const now = Date.now();
  const cached = appTokenCache[scopeKey];
  if (cached && now < cached.expiresAt - TOKEN_EXPIRATION_BUFFER) {
    return cached.token;
  }
  const clientId = process.env.EBAY_CLIENT_ID!;
  const clientSecret = process.env.EBAY_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const params = new URLSearchParams();
  params.set('grant_type', 'client_credentials');
  params.set('scope', scopeStr);

  const resp = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  } as any);

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Failed to get app token for scope: ${scopeStr}. Status ${resp.status}. ${text?.slice(0, 200)}`);
  }
  const data = await resp.json();
  const token: string = data.access_token;
  const expiresInSec: number = Number(data.expires_in || 3600);
  appTokenCache[scopeKey] = { token, expiresAt: now + expiresInSec * 1000 };
  return token;
}

// --- UNIFIED & SAFE ITEM MAPPER ---
function mapToEbayItem(rawItem: any, apiType: 'Browse' | 'Insights'): EbayItem {
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
  // Insights: разные поля, стараемся взять цену из lastSoldPrice/price
  const priceValue = rawItem?.lastSoldPrice?.value ?? rawItem?.price?.value ?? rawItem?.soldPrice?.value ?? '0';
  const priceCurrency = rawItem?.lastSoldPrice?.currency ?? rawItem?.price?.currency ?? rawItem?.soldPrice?.currency ?? 'N/A';
  return {
    itemId: rawItem?.itemId || rawItem?.listingId || rawItem?.transactionId || 'N/A',
    title: rawItem?.title || rawItem?.product?.title || 'No Title',
    price: {
      value: String(priceValue),
      currency: priceCurrency,
    },
  };
}

// --- API CALLS ---

// Инициализируем eBayApi один раз: используется для Browse API
const ebayApi = new eBayApi({
  appId: process.env.EBAY_CLIENT_ID!,
  certId: process.env.EBAY_CLIENT_SECRET!, // из-за особенностей библиотеки
  devId: 'dummy',
  sandbox: false,
});

async function searchActiveItems(keyword: string, config: BrowseApiConfig, options?: { token?: string }): Promise<EbayItem[]> {
  try {
    const providedToken = options?.token;
    if (!providedToken) {
      const authToken = await getEbayAppToken('browse');
      ebayApi.OAuth2.setCredentials(authToken);
    }

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
    return [];
  }
}

function resolveMarketplaceIdForKeyword(defaultMarketplaceId?: string, keyword?: string): string {
  // Если явно задан не-US маркетплейс, уважаем его и не переопределяем
  if (defaultMarketplaceId && defaultMarketplaceId.trim() && defaultMarketplaceId.trim() !== 'EBAY_US') {
    return defaultMarketplaceId.trim();
  }
  const autoPartPattern = /[A-Za-z0-9]+-[A-Za-z0-9-]+/;
  // Для US по умолчанию различаем обычный и Motors по эвристике (только для Browse).
  return autoPartPattern.test(String(keyword)) ? 'EBAY_MOTORS_US' : 'EBAY_US';
}

function coerceInsightsMarketplaceId(marketplaceId: string): string {
  // Marketplace Insights, согласно документации, поддерживает стандартные маркеты (например, EBAY_US),
  // но не EBAY_MOTORS_US. В таких случаях используем EBAY_US.
  if (marketplaceId === 'EBAY_MOTORS_US') return 'EBAY_US';
  return marketplaceId;
}

async function searchInsights(keyword: string, config: InsightsApiConfig): Promise<EbayItem[]> {
  const resolvedId = resolveMarketplaceIdForKeyword(config.marketplaceId, keyword);
  const marketplaceId = coerceInsightsMarketplaceId(resolvedId);
  const scopeStr = 'https://api.ebay.com/oauth/api_scope/buy.marketplace.insights';

  const browseFallback = async (): Promise<EbayItem[]> => {
    try {
      const token = await getEbayAppToken('browse');
      ebayApi.OAuth2.setCredentials(token);
      const response = await ebayApi.buy.browse.search({ q: String(keyword), limit: EBAY_SEARCH_LIMIT, filter: 'buyingOptions:{FIXED_PRICE}' });
      const items = response.itemSummaries || [];
      console.warn(`[Insights->Browse Fallback] Using Browse for keyword '${keyword}' (insights unavailable)`);
      return items.map((it: any) => mapToEbayItem(it, 'Browse'));
    } catch (e) {
      console.error(`[Insights->Browse Fallback] Failed for keyword '${keyword}':`, e);
      return [];
    }
  };

  const doRequest = async (retry: boolean): Promise<EbayItem[]> => {
    let token: string;
    try {
      token = await getAppTokenForScope('insights', scopeStr);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (/invalid_scope/i.test(msg)) {
        // У приложения нет доступа к Marketplace Insights — уходим в Browse fallback
        return browseFallback();
      }
      throw err;
    }

    const now = new Date();
    const fromDate = new Date(now.getTime() - config.periodDays * 24 * 60 * 60 * 1000);

    const url = new URL('https://api.ebay.com/buy/marketplace_insights/v1_beta/item_sales/search');
    url.searchParams.set('q', String(keyword));
    url.searchParams.set('limit', String(EBAY_SEARCH_LIMIT));
    if (config.sort) url.searchParams.set('sort', config.sort);

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
      },
    } as any);

    if (resp.status === 429) {
      const e: any = new Error('EBAY_RATE_LIMIT');
      e.cause = 'Rate limit from Marketplace Insights';
      throw e;
    }

    if (resp.status === 401 && !retry) {
      delete (appTokenCache as any)['insights'];
      return doRequest(true);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.warn(`[Insights] Non-OK response ${resp.status}: ${text?.slice(0, 200)}`);
      return [];
    }

    const data = await resp.json().catch(() => ({}));
    const items = data?.itemSales || data?.sales || data?.items || [];
    return (Array.isArray(items) ? items : []).map((it: any) => mapToEbayItem(it, 'Insights'));
  };

  try {
    return await doRequest(false);
  } catch (err: any) {
    if (typeof err?.message === 'string' && err.message.startsWith('EBAY_RATE_LIMIT')) throw err;
    if (err?.message === 'EBAY_RATE_LIMIT') throw err;
    console.error(`Error searching insights for keyword '${keyword}':`, err);
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
    try {
      const token = await getEbayAppToken('browse');
      ebayApi.OAuth2.setCredentials(token);
      const promises = keywords.map((keyword) =>
        searchActiveItems(keyword, searchConfig as BrowseApiConfig, { token })
      );
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error in Promise.all for searchItemsByKeyword (ACTIVE):', error);
      return keywords.map(() => []);
    }
  } else if (configKey === 'SOLD' || configKey === 'ENDED') {
    // SOLD / ENDED -> Insights
    const resultsMap = new Map<string, EbayItem[]>();
    const norm = (s: string) => String(s || '').trim();
    const uniqueKeywords = Array.from(new Set(keywords.map(norm).filter(Boolean)));

    for (const keyword of uniqueKeywords) {
      try {
        const arr = await searchInsights(keyword, searchConfig as InsightsApiConfig);
        resultsMap.set(keyword, arr);
      } catch (e: any) {
        if (typeof e?.message === 'string' && e.message.startsWith('EBAY_RATE_LIMIT')) {
          // Пробрасываем ограничение частоты запросов наверх, чтобы корректно обработать в боте
          throw e;
        }
        console.error('Error searching insights keyword:', keyword, e);
        resultsMap.set(keyword, []);
      }
    }

    return keywords.map(k => resultsMap.get(norm(k)) || []);
  } else {
    // Теоретически сюда не попадём, т.к. getEbaySearchConfig бросит ошибку на неизвестный ключ.
    throw new Error(`Unsupported eBay search config key: ${configKey}`);
  }
}
