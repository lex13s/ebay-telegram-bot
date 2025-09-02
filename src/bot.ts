/**
 * @file Contains all Telegram bot-related logic, including initialization and message handlers.
 */

import TelegramBot from 'node-telegram-bot-api'
import { findItem } from './ebay'
import { createExcelReport } from './excel'
import { BOT_MESSAGES, FILE_NAME_PREFIX, START_COMMAND_REGEX, PART_NUMBER_DELIMITER_REGEX } from './constants'

const token = process.env.TELEGRAM_BOT_TOKEN
const appUrl = process.env.APP_URL

if (!token) {
  console.error('Telegram Bot Token is not provided! Please add it to your .env file.')
  process.exit(1)
}

// Export the secret path to be used by the server
export const secretPath = `/bot${token}`

// Export the bot instance to be used by the server
export const bot = new TelegramBot(token)

// Set webhook
if (process.env.NODE_ENV === 'production') {
  if (!appUrl) {
    console.error('APP_URL is not set. You need to set it for webhook to work.')
    process.exit(1)
  }
  const webhookUrl = `${appUrl}${secretPath}`
  bot.setWebHook(webhookUrl).then(() => {
    console.log(`Webhook set to ${webhookUrl}`)
  })
}

/**
 * Handles the /start command.
 */
bot.onText(START_COMMAND_REGEX, (msg: TelegramBot.Message) => {
  bot.sendMessage(msg.chat.id, BOT_MESSAGES.start.trim())
})

/**
 * Main message handler for processing part number requests.
 */
bot.on('message', async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id
  const text = msg.text

  if (!text || text.startsWith('/')) {
    return // Ignore commands
  }

  console.log(`Received message from ${chatId}: ${text}`)
  bot.sendMessage(chatId, BOT_MESSAGES.processing)

  const partNumbers = text.split(PART_NUMBER_DELIMITER_REGEX).filter((pn) => pn.trim().length > 0)

  if (partNumbers.length === 0) {
    bot.sendMessage(chatId, BOT_MESSAGES.noPartNumbers)
    return
  }

  try {
    bot.sendMessage(chatId, (BOT_MESSAGES as any).searching(partNumbers.length))

    const rawResults = await Promise.all(
      partNumbers.map(async (pn) => {
        const item = await findItem(pn)
        return {
          partNumber: pn,
          title: item ? item.title : 'Not Found',
          price: item ? item.price : 'N/A',
          found: !!item, // Add a flag to indicate if item was found
        }
      })
    )

    // Filter out items that were not found
    const successfulResults = rawResults.filter((result) => result.found)

    if (successfulResults.length > 0) {
      bot.sendMessage(chatId, BOT_MESSAGES.searchComplete)

      const reportBuffer = await createExcelReport(successfulResults) // Use filtered results
      const fileName = `${FILE_NAME_PREFIX}${Date.now()}.xlsx`

      await bot.sendDocument(
        chatId,
        reportBuffer,
        {},
        {
          filename: fileName,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
      )
    } else {
      // If no items were found at all
      bot.sendMessage(chatId, BOT_MESSAGES.noItemsFoundOrError)
    }
  } catch (error) {
    console.error('An error occurred during message processing:', error)
    bot.sendMessage(chatId, BOT_MESSAGES.error)
  }
})

console.log('Bot logic initialized...')
