import 'dotenv/config';
import { findItem } from './ebay';

const testPartNumber: string = '90915-YZZE1'; // A common Toyota oil filter part number
const ebayOAuthToken = process.env.EBAY_OAUTH_TOKEN;

console.log(`Testing eBay API with OAuth Token: ${ebayOAuthToken ? 'Loaded' : 'MISSING'} and Search Term: ${testPartNumber}`);

if (!ebayOAuthToken || ebayOAuthToken === 'YOUR_OAUTH_TOKEN_HERE') {
    console.error('eBay OAuth Token is not set in the .env file. Aborting test.');
    process.exit(1);
}

(async () => {
    try {
        const item = await findItem(testPartNumber, ebayOAuthToken);

        if (item) {
            console.log('\n--- SUCCESS ---');
            console.log('Found item on eBay:');
            console.log(`  Title: ${item.title}`);
            console.log(`  Price: ${item.price}`);
            console.log('\nConnection to eBay API is working correctly!');
        } else {
            console.log('\n--- NO ITEM FOUND ---');
            console.log(`Could not find an item for part number ${testPartNumber}.`);
            console.log('This might be okay, but it could also indicate an issue with the API or the part number.');
        }
    } catch (error: any) {
        console.error('\n--- ERROR ---');
        console.error('An error occurred during the test:', error);
    }
})();
