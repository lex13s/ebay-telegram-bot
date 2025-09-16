/**
 * @file Contains all Telegram bot-related logic, including initialization and message handlers.
 */

import TelegramBot from 'node-telegram-bot-api'
import { findItem } from './ebay'
import { createExcelReport } from './excel'
import { BOT_MESSAGES, FILE_NAME_PREFIX, START_COMMAND_REGEX, PART_NUMBER_DELIMITER_REGEX } from './constants'
import { randomBytes } from 'crypto'
import { config } from './config'
import {
  getOrCreateUser,
  getUser,
  updateUserBalance,
  createCoupon,
  getCoupon,
  activateCoupon,
} from './database'
import { sendInvoice, registerPaymentHandlers } from './paymentHandlers'

/**
 * Initializes and configures the Telegram bot.
 */
export function initializeBot(): void {
  // Используем токен из централизованного конфига, а не напрямую из process.env
  const bot = new TelegramBot(config.telegramToken, { polling: true })

  // Регистрируем обработчики платежей
  registerPaymentHandlers(bot)

  // Определяем клавиатуру с основными командами
  const keyboard: TelegramBot.ReplyKeyboardMarkup = {
    keyboard: [
      [{ text: '/balance 💰' }, { text: '/topup 💳' }],
      [{ text: '/redeem 🎁' }],
    ],
    resize_keyboard: true,
  }

  /**
   * Handles the /start command.
   */
  bot.onText(START_COMMAND_REGEX, async (msg: TelegramBot.Message) => {
    if (!msg.from) return
    const user = await getOrCreateUser(msg.from.id, msg.from.username)
    await bot.sendMessage(
      msg.chat.id,
      BOT_MESSAGES.start(msg.from.first_name, (user.balance_cents / 100).toFixed(2)),
      { reply_markup: keyboard }
    )
  })

  /**
   * Main message handler for processing part number requests.
   */
  bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    const text = msg.text

    if (!text || text.startsWith('/')) {
      return // Игнорируем команды в этом обработчике
    }

    // --- Проверка баланса и расчет стоимости ---
    if (!msg.from) return
    const user = await getOrCreateUser(msg.from.id, msg.from.username)

    const partNumbers = text.split(PART_NUMBER_DELIMITER_REGEX).filter((pn) => pn.trim().length > 0)

    if (partNumbers.length === 0) {
      bot.sendMessage(chatId, BOT_MESSAGES.noPartNumbers)
      return
    }

    const totalCost = partNumbers.length * config.costPerRequestCents

    if (user.balance_cents < totalCost) {
      await bot.sendMessage(chatId, BOT_MESSAGES.insufficientFunds, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Пополнить баланс', callback_data: 'topup' }],
            [{ text: '🎁 Использовать купон', callback_data: 'redeem_prompt' }],
          ],
        },
      })
      return // Останавливаем выполнение
    }

    console.log(`Received message from ${chatId}: ${text}`)
    bot.sendMessage(chatId, BOT_MESSAGES.processing)

    try {
      // Списываем средства только перед началом реальной работы
      const newBalance = user.balance_cents - totalCost
      await updateUserBalance(user.user_id, newBalance)

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
        // Сообщаем об успешном списании и остатке
        await bot.sendMessage(
          chatId,
          BOT_MESSAGES.requestComplete(
            (totalCost / 100).toFixed(2),
            (newBalance / 100).toFixed(2)
          )
        )
      } else {
        // Если ничего не найдено, возвращаем деньги, так как поиск был, но результата нет
        await updateUserBalance(user.user_id, user.balance_cents)
        bot.sendMessage(
          chatId,
          BOT_MESSAGES.noItemsFoundAndRefund(
            (user.balance_cents / 100).toFixed(2)
          )
        )
      }
    } catch (error) {
      console.error('An error occurred during message processing:', error)
      bot.sendMessage(chatId, BOT_MESSAGES.error)
      // Возвращаем средства на баланс в случае ошибки
      await updateUserBalance(user.user_id, user.balance_cents)
      await bot.sendMessage(
        chatId,
        BOT_MESSAGES.refundOnEror((user.balance_cents / 100).toFixed(2))
      )
    }
  })

  // --- Новые обработчики команд ---

  bot.onText(/\/balance/, async (msg) => {
    if (!msg.from) return
    const user = await getUser(msg.from.id)
    const balance = user ? user.balance_cents : 0
    await bot.sendMessage(msg.chat.id, BOT_MESSAGES.currentBalance((balance / 100).toFixed(2)))
  })

  bot.onText(/\/topup/, (msg) => sendInvoice(bot, msg.chat.id))

  bot.onText(/\/redeem(?: (.+))?/, async (msg, match) => {
    if (!msg.from) return
    const code = match?.[1]
    if (!code) {
      return bot.sendMessage(msg.chat.id, BOT_MESSAGES.redeemCouponPrompt)
    }

    const coupon = await getCoupon(code)
    if (!coupon || coupon.is_activated) {
      return bot.sendMessage(msg.chat.id, BOT_MESSAGES.redeemCouponNotFound)
    }

    const user = await getOrCreateUser(msg.from.id)
    const newBalance = user.balance_cents + coupon.value_cents

    await activateCoupon(code, user.user_id)
    await updateUserBalance(user.user_id, newBalance)

    await bot.sendMessage(
      msg.chat.id,
      BOT_MESSAGES.redeemCouponSuccess(
        (coupon.value_cents / 100).toFixed(2),
        (newBalance / 100).toFixed(2)
      )
    )
  })

  // --- Админ-команды ---
  bot.onText(/\/generatecoupon(?: (.+))?/, async (msg, match) => {
    if (msg.from?.id !== config.adminId) {
      return bot.sendMessage(msg.chat.id, BOT_MESSAGES.adminOnly)
    }
    const valueDollarsStr = match?.[1]
    const valueDollars = parseFloat(valueDollarsStr || '')
    if (isNaN(valueDollars)) {
      return bot.sendMessage(msg.chat.id, BOT_MESSAGES.generateCouponUsage)
    }

    const valueCents = Math.round(valueDollars * 100)
    const code = `C-${randomBytes(4).toString('hex').toUpperCase()}`

    try {
      await createCoupon(code, valueCents)
      await bot.sendMessage(msg.chat.id, BOT_MESSAGES.generateCouponSuccess(code, valueDollars.toFixed(2)), {
        parse_mode: 'Markdown',
      })
    } catch (error) {
      await bot.sendMessage(msg.chat.id, BOT_MESSAGES.generateCouponError)
    }
  })

  // --- Обработка инлайн-кнопок ---
  bot.on('callback_query', (query) => {
    if (!query.message) return
    if (query.data === 'topup') {
      sendInvoice(bot, query.message.chat.id)
    } else if (query.data === 'redeem_prompt') {
      bot.sendMessage(query.message.chat.id, BOT_MESSAGES.redeemCouponActionPrompt)
    }
    bot.answerCallbackQuery(query.id)
  })

  /**
   * Handles polling errors.
   */
  bot.on('polling_error', (error) => {
    console.error('Polling error:', error)
  })

  console.log('Bot has been initialized and started...')
}
