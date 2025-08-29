import { EBAY_API_URL } from './constants';

/**
 * @file Handles all interactions with the eBay Finding API.
 */

// --- TYPE DEFINITIONS for eBay API Response ---
// These interfaces model the nested structure of the JSON response from the eBay API.
// This helps ensure type safety when accessing response data.

interface EbayPrice {
    __value__: string;
}

interface SellingStatus {
    currentPrice: EbayPrice[];
}

interface Item {
    title: string[];
    sellingStatus: SellingStatus[];
}

interface SearchResult {
    item: Item[];
}

interface FindItemsByKeywordsResponse {
    searchResult: SearchResult[];
}

interface EbayFindingResponse {
    findItemsByKeywordsResponse: FindItemsByKeywordsResponse[];
}

/** Represents a successfully found and parsed item from eBay. */
export interface FoundItem {
    title: string;
    price: string;
}

/**
 * Finds a single item on eBay using the Finding API.
 * It returns the title and price of the first search result.
 * 
 * @param keywords - The part number or keywords to search for.
 * @param appId - The eBay App ID for authenticating the API request.
 * @returns A Promise that resolves with a FoundItem object, or null if no item is found or an error occurs.
 */
export async function findItem(keywords: string, appId: string): Promise<FoundItem | null> {
    // If the eBay App ID is missing, the bot enters a mock mode for testing and development.
    // This avoids making real API calls without credentials and allows offline testing.
    if (!appId || appId === 'YOUR_EBAY_APP_ID_HERE') {
        console.log('eBay App ID is not configured. Returning mock data.');
        return {
            title: `Mock Item for ${keywords}`,
            price: (Math.random() * 100).toFixed(2),
        };
    }

    const url = new URL(EBAY_API_URL);
    const params: Record<string, string> = {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': appId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        'REST-PAYLOAD': 'true',
        'keywords': keywords,
        'paginationInput.entriesPerPage': '1' // We only need the top result.
    };
    url.search = new URLSearchParams(params).toString();

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            // Throw an error if the HTTP response is not successful (e.g., 4xx, 5xx status).
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: EbayFindingResponse = await response.json();

        // Safely navigate the nested JSON structure of the eBay API response.
        // The optional chaining operator (?.) prevents errors if any intermediate property is null or undefined.
        const items = data.findItemsByKeywordsResponse[0]?.searchResult[0]?.item;

        if (items && items.length > 0) {
            const item = items[0];
            const title = item.title[0];
            const price = item.sellingStatus[0].currentPrice[0].__value__;
            return { title, price };
        } else {
            // Return null if the search yielded no results.
            return null;
        }
    } catch (error) {
        console.error(`Error fetching data from eBay for keywords: ${keywords}`, error);
        return null;
    }
}