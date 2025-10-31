import eBayApi from 'ebay-api';
import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { EBAY_SEARCH_LIMIT, TOKEN_EXPIRATION_BUFFER } from './constants';
import { EbayItem } from './types/ebay-api';

let appTokenCache = {
  token: null as string | null,
  expiresAt: 0,
};

async function getEbayAppToken(): Promise<string> {
  const now = Date.now();

  if (appTokenCache.token && now < appTokenCache.expiresAt - TOKEN_EXPIRATION_BUFFER) {
    return appTokenCache.token;
  }

  console.log('Fetching new eBay application token...');
  const env = 'PRODUCTION';

  const ebayAuthToken = new EbayAuthToken({
    clientId: process.env.EBAY_CLIENT_ID!,
    clientSecret: process.env.EBAY_CLIENT_SECRET!,
    env: env,
  });

  const tokenResponse = await ebayAuthToken.getApplicationToken(env);
  const token = JSON.parse(tokenResponse);

  appTokenCache = {
    token: token.access_token,
    expiresAt: now + token.expires_in * 1000,
  };

  return appTokenCache.token!;
}

const ebayApi = new eBayApi({
  appId: process.env.EBAY_CLIENT_ID!,
  certId: 'dummy',
  devId: 'dummy',
  sandbox: false,
});

export async function searchItemsByKeyword(keyword: string): Promise<EbayItem[]> {
  const authToken = await getEbayAppToken();
  ebayApi.OAuth2.setCredentials(authToken);

  const response = await ebayApi.buy.browse.search({
    q: keyword,
    limit: EBAY_SEARCH_LIMIT,
  });

  return response.itemSummaries || [];
}
