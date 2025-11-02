import dotenv from 'dotenv'
dotenv.config()

import { findItem } from '../src/ebay'

// A common part number for testing purposes.
const testPartNumbers = ['90915-YZZE1', '1629995-00-',
    '1583991-03-c',
  '1086299-00-h'
] // Переименовано для ясности
console.log(`Testing eBay API with part numbers: "${testPartNumbers.join(', ')}"`)
console.log(`Using NODE_ENV: "${process.env.NODE_ENV}"`)
;(async () => {
  try {
    // Call findItem with the config key, as the new logic requires it.
    const results = await findItem(testPartNumbers, 'SOLD') // findItem теперь возвращает массив

    if (results.length > 0) {
      console.log('\n--- RESULTS ---')
      results.forEach(res => {
        if (res.result) {
          console.log(`Found item for part number: ${res.partNumber}`)
          console.log(`  Title: ${res.result.title}`)
          console.log(`  Price: ${res.result.price}`)
        } else {
          console.log(`No item found for part number: ${res.partNumber}`)
        }
      })
      console.log('\nConnection to eBay API is working correctly!')
    } else {
      console.log('\n--- NO ITEMS FOUND ---')
      console.log(`Could not find any items for the provided part numbers. This might be okay, but it could also indicate an issue with the API or the part numbers.`)
    }
  } catch (error: any) {
    console.error('\n--- ERROR ---')
    console.error('An error occurred during the test:', error)
    process.exit(1)
  }
})()
