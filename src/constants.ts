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
  start: (firstName: string, balance: string) =>
    `👋 Здравствуйте, ${firstName}!\n\n` +
    `Это бот с оплатой за использование. Ваш текущий баланс: $${balance}.\n\n` +
    `Отправьте мне один или несколько парт-номеров для поиска (это платное действие).`,
  /** Message sent when the bot starts processing a request. */
  processing: '⚙️ Начинаю обработку вашего запроса...',
  /** Message sent when the eBay search is complete and Excel generation begins. */
  searchComplete: '✅ Поиск завершен. Создаю Excel-отчет...',
  /** Error message when the user sends a message with no valid part numbers. */
  noPartNumbers: 'Пожалуйста, введите хотя бы один партномер.',
  /** Generic error message for any unhandled exceptions during processing. */
  error: 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.',
  /** Message when no items are found for a search query, and the cost is refunded. */
  noItemsFoundAndRefund: (balance: string) =>
    `❌ По вашему запросу ничего не найдено. Средства возвращены на ваш баланс. Текущий баланс: $${balance}`,
  /** Message when a refund is issued due to an internal error. */
  refundOnEror: (balance: string) =>
    `⚠️ Произошла ошибка при обработке вашего запроса. Средства были возвращены на ваш баланс. Текущий баланс: $${balance}`,
  /** Message indicating how many part numbers are being searched for. */
  searching: (count: number) => `Ищу информацию по ${count} номер(у/ам)...`,

  // Payment and Balance Messages
  insufficientFunds: '🚫 На вашем балансе недостаточно средств для выполнения запроса.',
  requestComplete: (cost: string, balance: string) =>
    `✅ Запрос выполнен! С вашего баланса списано $${cost}. Остаток: $${balance}.`,
  currentBalance: (balance: string) => `Ваш текущий баланс: $${balance}`,
  paymentSuccess: (amount: string, balance: string) =>
    `✅ Оплата прошла успешно!\n\nВаш баланс пополнен на $${amount}.\nТекущий баланс: $${balance}.`,

  // Coupon Messages
  redeemCouponPrompt: 'Пожалуйста, укажите код купона. Пример: /redeem MY-COUPON-123',
  redeemCouponNotFound: '❌ Купон не найден или уже был использован.',
  redeemCouponSuccess: (amount: string, balance: string) =>
    `✅ Купон успешно активирован!\nВаш баланс пополнен на $${amount}.\nНовый баланс: $${balance}.`,
  redeemCouponActionPrompt: 'Пожалуйста, отправьте мне купон командой /redeem <код_купона>',

  // Admin Messages
  adminOnly: '⛔️ Эта команда доступна только администратору.',
  generateCouponUsage: 'Использование: /generatecoupon <сумма_в_долларах>\nПример: /generatecoupon 10',
  generateCouponSuccess: (code: string, amount: string) => `✅ Создан новый купон:\n\nКод: ${code}\nСумма: $${amount}`,
  generateCouponError: '❌ Ошибка при создании купона.',

  // Invoice Messages
  invoiceTitle: 'Пополнение баланса',
  invoiceDescription: (cost: string) => `Покупка кредитов для бота на сумму $${cost}`,
}

/** The prefix for the generated Excel file name. */
export const FILE_NAME_PREFIX = 'eBay_Report_'

export const EBAY_SEARCH_LIMIT = 1
