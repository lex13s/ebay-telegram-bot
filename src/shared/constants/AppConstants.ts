/**
 * Regular expressions used throughout the application
 */
export const RegexPatterns = {
  START_COMMAND: /\/start/,
  PART_NUMBER_DELIMITER: /[\n\s,]+/,
} as const;

/**
 * eBay related constants
 */
export const EbayConstants = {
  API_URL: 'https://api.ebay.com/buy/browse/v1/item_summary/search',
  MARKETPLACE_ID: 'EBAY_US',
} as const;

/**
 * File related constants
 */
export const FileConstants = {
  EXCEL_FILE_PREFIX: 'eBay_Report_',
  EXCEL_CONTENT_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;
