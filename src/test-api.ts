import dotenv from 'dotenv'
dotenv.config()

import { findItem } from './ebay'

// A common part number for testing purposes.
const testPartNumber = '90915-YZZE1'
console.log(`Testing eBay API with part number: "${testPartNumber}"`)
console.log(`Using NODE_ENV: "${process.env.NODE_ENV}"`)
;(async () => {
  try {
    // Call findItem with the config key, as the new logic requires it.
    const item = await findItem(testPartNumber, 'SOLD')

    if (item) {
      console.log('\n--- SUCCESS ---')
      console.log('Found item on eBay:')
      console.log(`  Title: ${item.title}`)
      console.log(`  Price: ${item.price}`)
      console.log('\nConnection to eBay API is working correctly!')
    } else {
      console.log('\n--- NO ITEM FOUND ---')
      console.log(`Could not find an item for part number "${testPartNumber}".`)
      console.log('This might be okay, but it could also indicate an issue with the API or the part number.')
    }
  } catch (error: any) {
    console.error('\n--- ERROR ---')
    console.error('An error occurred during the test:', error)
    process.exit(1)
  }
})()
