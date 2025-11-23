/**
 * @file Centralized constants for the application.
 */

// Regular Expressions

/** Regex to match the /start command. */
export const START_COMMAND_REGEX = /\/start/

/** Regex to split user input into multiple part numbers. Splits by newlines, spaces, or commas. */
export const PART_NUMBER_DELIMITER_REGEX = /[\n\s,]+/

// Constants for ebay.ts

/** The official URL for the eBay Finding API. */
export const EBAY_API_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search'

/** The default eBay marketplace ID for Browse API requests. */
export const EBAY_MARKETPLACE_ID = 'EBAY_US'

// Constants for index.ts

/** A collection of user-facing messages used by the bot. */
export const BOT_MESSAGES = {
  /** The initial welcome message sent on /start. */
  start: (firstName: string) => `👋 Hello, ${firstName}!\n\nPlease send me one or more part numbers to search.`,
  /** The main menu text. */
  mainMenu: (balance: string) => `Your current balance: $${balance}.\n\nPlease select an action:`,
  /** Message sent when the bot starts processing a request. */
  processing: '⚙️ Processing your request...',
  /** Message sent when the eBay search is complete and Excel generation begins. */
  searchComplete: '✅ Search complete. Creating Excel report...',
  /** Error message when the user sends a message with no valid part numbers. */
  noPartNumbers: 'Please enter at least one part number.',
  /** Generic error message for any unhandled exceptions during processing. */
  error: 'An unexpected error occurred. Please try again.',
  /** Message when no items are found for a regular user, and the cost is refunded. */
  noItemsFoundAndRefund: (balance: string) =>
    `❌ Nothing found for your request. Funds have been returned to your balance. Current balance: $${balance}`,
  /** A simple message when no items are found (e.g., for an admin). */
  noItemsFound: '❌ Nothing found for your request.',
  /** Message when a refund is issued due to an internal error. */
  refundOnEror: (balance: string) =>
    `⚠️ An error occurred while processing your request. Funds have been returned to your balance. Current balance: $${balance}`,
  /** Message indicating how many part numbers are being searched for. */
  searching: (count: number) => `Searching for information on ${count} part number(s)...`,

  // Payment and Balance Messages
  insufficientFunds: '🚫 Insufficient funds in your balance to complete the request.',
  requestComplete: (cost: string, balance: string) =>
    `✅ Request completed! $${cost} has been deducted from your balance. Remaining balance: $${balance}.`,
  /** Message for a successfully completed free request (e.g., for an admin). */
  requestCompleteFree: '✅ Request completed!',
  currentBalance: (balance: string) => `Your current balance: $${balance}`,
  paymentSuccess: (amount: string, balance: string) =>
    `✅ Payment successful!\n\nYour balance has been topped up by $${amount}.\nCurrent balance: $${balance}.`,

  // Coupon Messages
  enterCouponCode: 'Please enter your coupon code:',
  redeemCouponNotFound: '❌ Coupon not found or already used.',
  redeemCouponSuccess: (amount: string, balance: string) =>
    `✅ Coupon successfully activated!\nYour balance has been topped up by $${amount}.\nNew balance: $${balance}.`,

  // Admin Messages
  adminOnly: '⛔️ This command is available only to the administrator.',
  enterCouponValue: 'Enter the coupon amount in dollars (e.g., 10 or 5.50):',
  generateCouponUsage: 'Usage: /generatecoupon <amount_in_dollars>\nExample: /generatecoupon 10',
  generateCouponSuccess: (code: string, amount: string) => `✅ New coupon created:\n\nCode: ${code}\nAmount: $${amount}`,
  generateCouponError: '❌ Error creating coupon.',

  // Invoice Messages
  invoiceTitle: 'Balance Top-up',
  invoiceDescription: (cost: string) => `Purchase of bot credits for $${cost}`,
  paymentsDisabled: 'Unfortunately, the payment function is temporarily disabled. Please try again later.',
}

/** The prefix for the generated Excel file name. */
export const FILE_NAME_PREFIX = 'eBay_Report_'

export const EBAY_SEARCH_LIMIT = '1';
export const TOKEN_EXPIRATION_BUFFER = 5 * 60 * 1000; // 5 minutes
