
/**
 * @file The main entry point for the application.
 * This file loads environment variables and starts the bot and the health check server.
 */

import dotenv from 'dotenv';
import { initializeBot } from './bot';
import { startServer } from './server';

// Load environment variables from the .env file
dotenv.config();

// Start the health check server for deployment platforms.
startServer();

// Initialize and start the Telegram bot.
initializeBot();
