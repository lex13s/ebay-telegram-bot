/**
 * @file Centralized constants for the application.
 */

// Regular Expressions

/** Regex to match the /start command. */
export const START_COMMAND_REGEX = /\/start/;

/** Regex to split user input into multiple part numbers. Splits by newlines, spaces, or commas. */
export const PART_NUMBER_DELIMITER_REGEX = /[\n\s,]+/;

// Constants for ebay.ts

/** The official URL for the eBay Finding API. */
export const EBAY_API_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

/** The default eBay marketplace ID for Browse API requests. */
export const EBAY_MARKETPLACE_ID = 'EBAY_US';

// Constants for index.ts

/** A collection of user-facing messages used by the bot. */
export const BOT_MESSAGES = {
    /** The initial welcome message sent on /start. */
    start: `
Привет! Я бот для поиска запчастей на eBay (TypeScript версия).

Отправьте мне список партномеров (каждый с новой строки или через пробел), и я найду для вас название и цену, а затем сформирую Excel-файл.

Например:
partnumber1
partnumber2
partnumber3
    `,
    /** Message sent when the bot starts processing a request. */
    processing: '⚙️ Начинаю обработку вашего запроса...',
    /** Message sent when the eBay search is complete and Excel generation begins. */
    searchComplete: '✅ Поиск завершен. Создаю Excel-отчет...',
    /** Error message when the user sends a message with no valid part numbers. */
    noPartNumbers: 'Пожалуйста, введите хотя бы один партномер.',
    /** Generic error message for any unhandled exceptions during processing. */
    error: '❌ Произошла ошибка при обработке вашего запроса. Попробуйте еще раз позже.',
    /** Message indicating how many part numbers are being searched for. */
    searching: (count: number) => `Ищу информацию по ${count} номер(у/ам)...`
};

/** The prefix for the generated Excel file name. */
export const FILE_NAME_PREFIX = 'eBay_Report_';
