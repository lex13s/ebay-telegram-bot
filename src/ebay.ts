import eBayApi from 'ebay-api';
import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { EBAY_SEARCH_LIMIT } from './constants';

let appTokenCache = {
  token: null as string | null,
  expiresAt: 0,
};

async function getEbayAppToken(): Promise<string> {
  const now = Date.now();

  if (appTokenCache.token && now < appTokenCache.expiresAt - 5 * 60 * 1000) {
    return appTokenCache.token;
  }

  console.log('Fetching new eBay application token...');
  const env = 'PRODUCTION';

  const ebayAuthToken = new EbayAuthToken({
    clientId: process.env.EBAY_CLIENT_ID!,
    clientSecret: process.env.EBAY_CLIENT_SECRET!,
    env: env,
  });

  const tokenData = await ebayAuthToken.getApplicationToken(env);
  const token = JSON.parse(tokenData);

  appTokenCache = {
    token: token.access_token,
    expiresAt: now + token.expires_in * 1000,
  };

  return appTokenCache.token!;
}

export async function findItem(partNumber: string): Promise<{ title: string; price: string } | null> {
  console.log(`Searching for part number: ${partNumber}`);

  try {
    const authToken = await getEbayAppToken();

    const ebayApi = new eBayApi({
      appId: process.env.EBAY_CLIENT_ID!,
      certId: 'dummy',
      devId: 'dummy',
      sandbox: false,
    });

    ebayApi.OAuth2.setCredentials(authToken);

    const response = await ebayApi.buy.browse.search({
      q: partNumber,
      limit: EBAY_SEARCH_LIMIT,
    });

    if (response.itemSummaries && response.itemSummaries.length > 0) {
      const item = response.itemSummaries[0];
      const price = item.price?.value ? `${item.price.value} ${item.price.currency}` : 'Price not available';
      console.log(`Found item: ${item.title}, Price: ${price}`);
      return {
        title: item.title!,
        price: price,
      };
    } else {
      console.log('Item not found.');
      return null;
    }
  } catch (error) {
    console.error('Error searching on eBay:', error);
    return null;
  }
}
