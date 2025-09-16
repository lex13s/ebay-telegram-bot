/**
 * @file Initializes and runs the Express server for the Telegram bot webhook.
 */

import express from 'express';
import { bot, secretPath } from './bot';

const port = process.env.PORT || 3000;
const app = express();

// Middleware to parse JSON bodies. Telegram sends updates in this format.
app.use(express.json());

// This is the webhook endpoint that Telegram will call.
app.post(secretPath, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200); // Acknowledge receipt of the update
});

// A simple health check endpoint
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});