/**
 * @file The main entry point for the Telegram bot.
 * This file handles bot initialization, command processing, and message handling.
 */

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import http from 'http';
import TelegramBot from 'node-telegram-bot-api';
import { findItem } from './ebay';
import { createExcelReport } from './excel';
import { BOT_MESSAGES, FILE_NAME_PREFIX, START_COMMAND_REGEX, PART_NUMBER_DELIMITER_REGEX } from './constants';

// --- CONFIGURATION ---

// Load credentials from environment variables.
const token = process.env.TELEGRAM_BOT_TOKEN;
const ebayAppId = process.env.EBAY_APP_ID;

// --- BOT INITIALIZATION ---

// Ensure the Telegram token is provided before starting the bot.
if (!token) {
    console.error('Telegram Bot Token is not provided! Please add it to your .env file.');
    process.exit(1); // Exit the process if the token is missing.
}

// Warn if the eBay App ID is missing, as the bot will only return mock data.
if (!ebayAppId) {
    console.warn('eBay App ID is not provided. The bot will run in mock mode.');
}

// Initialize the bot with the token and start polling for updates.
const bot = new TelegramBot(token, { polling: true });

console.log('Bot has been started in TypeScript...');

// --- BOT COMMANDS ---

/**
 * Handles the /start command, sending a welcome message to the user.
 */
bot.onText(START_COMMAND_REGEX, (msg: TelegramBot.Message) => {
    bot.sendMessage(msg.chat.id, BOT_MESSAGES.start.trim());
});

// --- MESSAGE HANDLER ---

/**
 * The main message handler for processing user requests.
 * It ignores commands and processes any other text message.
 */
bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore any message that is a command (starts with '/') or is empty.
    if (!text || text.startsWith('/')) {
        return;
    }

    console.log(`Received message from ${chatId}: ${text}`);
    bot.sendMessage(chatId, BOT_MESSAGES.processing);

    // Parse the user's message into an array of part numbers.
    const partNumbers = text.split(PART_NUMBER_DELIMITER_REGEX).filter(pn => pn.trim().length > 0);

    if (partNumbers.length === 0) {
        bot.sendMessage(chatId, BOT_MESSAGES.noPartNumbers);
        return;
    }

    try {
        bot.sendMessage(chatId, BOT_MESSAGES.searching(partNumbers.length));

        // Process all part numbers concurrently for efficiency.
        const results = await Promise.all(partNumbers.map(async (pn) => {
            const item = await findItem(pn, ebayAppId!); // The non-null assertion (!) is safe because we check for ebayAppId at startup.
            return {
                partNumber: pn,
                title: item ? item.title : 'Not Found',
                price: item ? item.price : 'N/A'
            };
        }));

        bot.sendMessage(chatId, BOT_MESSAGES.searchComplete);

        // Generate the Excel file from the results.
        const reportBuffer = await createExcelReport(results);
        const fileName = `${FILE_NAME_PREFIX}${Date.now()}.xlsx`;

        // Send the generated Excel file back to the user.
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

// --- ERROR HANDLING ---

/**
 * Handles polling errors from the Telegram API.
 */
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// --- WEB SERVER FOR RENDER HEALTH CHECKS ---
// This is a simple server that responds to health checks from Render.
// It allows the bot, which uses polling, to be deployed as a "Web Service".
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is alive!\n');
}).listen(PORT, () => {
    console.log(`Health check server running on port ${PORT}`);
});