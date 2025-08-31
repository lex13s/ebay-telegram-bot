/**
 * @file Contains all Telegram bot-related logic, including initialization and message handlers.
 */

import TelegramBot from 'node-telegram-bot-api';
import { findItem } from './ebay';
import { createExcelReport } from './excel';
import { BOT_MESSAGES, FILE_NAME_PREFIX, START_COMMAND_REGEX, PART_NUMBER_DELIMITER_REGEX } from './constants';

/**
 * Initializes and configures the Telegram bot.
 */
export function initializeBot(): void {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const ebayOAuthToken = process.env.EBAY_OAUTH_TOKEN;

    if (!token) {
        console.error('Telegram Bot Token is not provided! Please add it to your .env file.');
        process.exit(1);
    }

    if (!ebayOAuthToken) {
        console.warn('eBay OAuth Token is not provided. The bot will run in mock mode.');
    }

    const bot = new TelegramBot(token, { polling: true });

    /**
     * Handles the /start command.
     */
    bot.onText(START_COMMAND_REGEX, (msg: TelegramBot.Message) => {
        bot.sendMessage(msg.chat.id, BOT_MESSAGES.start.trim());
    });

    /**
     * Main message handler for processing part number requests.
     */
    bot.on('message', async (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!text || text.startsWith('/')) {
            return; // Ignore commands
        }

        console.log(`Received message from ${chatId}: ${text}`);
        bot.sendMessage(chatId, BOT_MESSAGES.processing);

        const partNumbers = text.split(PART_NUMBER_DELIMITER_REGEX).filter(pn => pn.trim().length > 0);

        if (partNumbers.length === 0) {
            bot.sendMessage(chatId, BOT_MESSAGES.noPartNumbers);
            return;
        }

        try {
            bot.sendMessage(chatId, BOT_MESSAGES.searching(partNumbers.length));

            const results = await Promise.all(partNumbers.map(async (pn) => {

                const item = await findItem(pn, ebayOAuthToken!);
                return {
                    partNumber: pn,
                    title: item ? item.title : 'Not Found',
                    price: item ? item.price : 'N/A'
                };
            }));

            bot.sendMessage(chatId, BOT_MESSAGES.searchComplete);

            const reportBuffer = await createExcelReport(results);
            const fileName = `${FILE_NAME_PREFIX}${Date.now()}.xlsx`;

            await bot.sendDocument(chatId, reportBuffer, {},
                {
                    filename: fileName,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            );

        } catch (error) {
            console.error('An error occurred during message processing:', error);
            bot.sendMessage(chatId, BOT_MESSAGES.error);
        }
    });

    /**
     * Handles polling errors.
     */
    bot.on('polling_error', (error) => {
        console.error('Polling error:', error);
    });

    console.log('Bot has been initialized and started...');
}
