// This is a temporary script to test the eBay API with live credentials.

require('dotenv').config();
const { findItem } = require('./dist/ebay.js');

const testPartNumber = '90915-YZZE1'; // A common Toyota oil filter part number
const ebayAppId = process.env.EBAY_APP_ID;

console.log(`Testing eBay API with App ID: ${ebayAppId ? 'Loaded' : 'MISSING'} and Search Term: ${testPartNumber}`);

if (!ebayAppId || ebayAppId === 'YOUR_EBAY_APP_ID_HERE') {
    console.error('eBay App ID is not set in the .env file. Aborting test.');
    process.exit(1);
}

(async () => {
    try {
        const item = await findItem(testPartNumber, ebayAppId);

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
    } catch (error) {
        console.error('\n--- ERROR ---');
        console.error('An error occurred during the test:', error);
    }
})();
