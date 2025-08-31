
import eBayApi from 'ebay-api';
import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { EBAY_SEARCH_LIMIT } from './constants';

// In-memory cache for the application token
let appTokenCache = {
    token: null as string | null,
    expiresAt: 0,
};

/**
 * Fetches and caches an eBay application access token.
 * The token is fetched using the Client Credentials Grant flow and is valid for 2 hours.
 * This function will reuse a cached token if it's still valid.
 *
 * @returns A promise that resolves to a valid eBay application access token.
 */
async function getEbayAppToken(): Promise<string> {
    const now = Date.now();

    // If we have a cached token and it's not expired (with a 5-minute buffer), reuse it.
    if (appTokenCache.token && now < appTokenCache.expiresAt - (5 * 60 * 1000)) {
        return appTokenCache.token;
    }

    console.log('Fetching new eBay application token...');
    const env = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX';

    const ebayAuthToken = new EbayAuthToken({
        clientId: process.env.EBAY_CLIENT_ID!,
        clientSecret: process.env.EBAY_CLIENT_SECRET!,
        env: env
    });
    const tokenData = await ebayAuthToken.getApplicationToken(env);
    const token = JSON.parse(tokenData);

    // Cache the new token and its expiry time
    appTokenCache = {
        token: token.access_token,
        expiresAt: now + (token.expires_in * 1000),
    };

    return appTokenCache.token!;
}

/**
 * Finds an item on eBay by its part number using a dynamically fetched app token.
 *
 * @param partNumber The part number to search for.
 * @returns A promise that resolves to the found item, or null if not found.
 */
export async function findItem(partNumber: string): Promise<{ title: string; price: string } | null> {
    console.log(`Searching for part number: ${partNumber}`);

    try {
        const authToken = await getEbayAppToken();

        // Instantiate the API client here, now that we have the token.
        const ebayApi = new eBayApi({
            appId: process.env.EBAY_CLIENT_ID!,
            certId: 'dummy', // certId is not needed for this flow, but the library might expect it.
            devId: 'dummy', // devId is not needed for this flow.
            sandbox: process.env.NODE_ENV !== 'production',
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
        // More detailed error logging can be added here if needed
        return null;
    }
}
