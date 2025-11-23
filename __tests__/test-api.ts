import dotenv from 'dotenv'
dotenv.config()

import { findItem } from '../src/ebay'

// A common part number for testing purposes.
const testPartNumbers = ['90915-YZZE1', '1629995-00-',
    '1583991-03-c',
  '1086299-00-h'
]
;(async () => {
  try {
    // Call findItem with the config key, as the new logic requires it.
    const results = await findItem(testPartNumbers, 'SOLD') // findItem now returns an array

    if (results.length > 0) {
      results.forEach(res => {
        if (res.result) {
          // Do nothing
        } else {
          // Do nothing
        }
      })
    } else {
      // Do nothing
    }
  } catch (error: any) {
    process.exit(1)
  }
})()
