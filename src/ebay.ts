import eBayApi from 'ebay-api';

// The eBay API client instance.
// It is initialized lazily to make the module easier to test.
// By delaying the instantiation, we can mock the 'ebay-api' module effectively in our tests.
let ebayApi: any;

/**
 * Lazily initializes and returns the eBay API client instance.
 * This approach is crucial for testability, as it allows Jest to mock the 'ebay-api'
 * module before this client is ever created.
 * @returns The singleton instance of the eBayApi client.
 */
function getEbayApi() {
    if (!ebayApi) {
        ebayApi = new eBayApi({
            appId: process.env.EBAY_APP_ID,
            certId: process.env.EBAY_CERT_ID,
            devId: process.env.EBAY_DEV_ID,
            sandbox: process.env.NODE_ENV !== 'production',
        });
    }
    return ebayApi;
}


export async function findItem(partNumber: string, authToken: string): Promise<{ title: string; price: string } | null> {
    console.log(`Searching for part number: ${partNumber}`);

    if (!authToken) {
        console.log('eBay OAuth Token is not configured. Returning mock data.');
        return {
            title: `Mock Item for ${partNumber}`,
            price: (Math.random() * 100).toFixed(2)
        };
    }

    try {
        // Get the API client instance.
        // This will be the real client in production and a mock in our tests.
        const api = getEbayApi();
        api.OAuth2.setCredentials(authToken);

        const response = await api.buy.browse.search({
            q: partNumber,
            limit: 1
        });

        if (response.itemSummaries && response.itemSummaries.length > 0) {
            const item = response.itemSummaries[0];
            const price = item.price?.value ? `${item.price.value} ${item.price.currency}` : 'Price not available';
            console.log(`Found item: ${item.title}, Price: ${price}`);
            return {
                title: item.title!,
                price: price
            };
        } else {
            console.log('Item not found.');
            return null;
        }
    } catch (error) {
        console.error('Error searching on eBay:', error);
        if (error && typeof error === 'object' && 'meta' in error) {
            const apiError = error as { meta: { error: { errors: { message: string }[] } } };
            if (apiError.meta?.error?.errors) {
                console.error('eBay API Error Details:', apiError.meta.error.errors.map(e => e.message).join(', '));
            }
        }
        return null;
    }
}