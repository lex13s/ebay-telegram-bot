import TelegramBot from 'node-telegram-bot-api';
import { findItem } from './ebay';
import { createExcelReport } from './excel';
import { BOT_MESSAGES, FILE_NAME_PREFIX, START_COMMAND_REGEX, PART_NUMBER_DELIMITER_REGEX } from './constants';
import { config } from './config';
import { getOrCreateUser, getUser, updateUserBalance } from './database';
import { sendInvoice, registerPaymentHandlers } from './paymentHandlers';
import {
    isAdmin,
    getReplyKeyboard,
    processCouponCode,
    processCouponGeneration
} from './utils';

export function initializeBot(): void {
  const bot = new TelegramBot(config.telegramToken, { polling: true });

  if (config.paymentsEnabled) {
    registerPaymentHandlers(bot);
    console.log('Payment handlers have been registered.');
  }

  bot.onText(START_COMMAND_REGEX, async (msg: TelegramBot.Message) => {
    if (!msg.from) return;
    const user = await getOrCreateUser(msg.from.id, msg.from.username);
    const userIsAdmin = isAdmin(user.user_id);

    await bot.sendMessage(
      msg.chat.id,
      BOT_MESSAGES.start(msg.from.first_name, (user.balance_cents / 100).toFixed(2)),
      { reply_markup: getReplyKeyboard(userIsAdmin) }
    );
  });

  bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (msg.reply_to_message && text) {
        if (msg.reply_to_message.text === BOT_MESSAGES.enterCouponCode) {
            await processCouponCode(bot, msg, text);
            return;
        }
        if (msg.reply_to_message.text === BOT_MESSAGES.enterCouponValue) {
            await processCouponGeneration(bot, msg, text);
            return;
        }
    }

    if (!text || text.startsWith('/')) {
      return;
    }

    if (!msg.from) return;
    const user = await getOrCreateUser(msg.from.id, msg.from.username);
    const userIsAdmin = isAdmin(user.user_id);

    const partNumbers = text.split(PART_NUMBER_DELIMITER_REGEX).filter((pn) => pn.trim().length > 0);

    if (partNumbers.length === 0) {
      bot.sendMessage(chatId, BOT_MESSAGES.noPartNumbers);
      return;
    }

    const totalCost = userIsAdmin ? 0 : partNumbers.length * config.costPerRequestCents;

    if (!userIsAdmin && user.balance_cents < totalCost) {
      await bot.sendMessage(chatId, BOT_MESSAGES.insufficientFunds, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Пополнить баланс', callback_data: 'topup' }],
            [{ text: '🎁 Использовать купон', callback_data: 'redeem_prompt' }],
          ],
        },
      });
      return;
    }

    console.log(`Received message from ${chatId}: ${text}`);
    bot.sendMessage(chatId, BOT_MESSAGES.processing);

    try {
      let newBalance = user.balance_cents;
      if (totalCost > 0) {
        newBalance = user.balance_cents - totalCost;
        await updateUserBalance(user.user_id, newBalance);
      }

      bot.sendMessage(chatId, (BOT_MESSAGES as any).searching(partNumbers.length));

      const rawResults = await Promise.all(
        partNumbers.map(async (pn) => {
          const item = await findItem(pn);
          return {
            partNumber: pn,
            title: item ? item.title : 'Not Found',
            price: item ? item.price : 'N/A',
            found: !!item,
          };
        })
      );

      const successfulResults = rawResults.filter((result) => result.found);

      if (successfulResults.length > 0) {
        bot.sendMessage(chatId, BOT_MESSAGES.searchComplete);

        const reportBuffer = await createExcelReport(successfulResults);
        const fileName = `${FILE_NAME_PREFIX}${Date.now()}.xlsx`;

        await bot.sendDocument(
          chatId,
          reportBuffer,
          {},
          {
            filename: fileName,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }
        );
        
        if (totalCost > 0) {
            await bot.sendMessage(
              chatId,
              BOT_MESSAGES.requestComplete(
                (totalCost / 100).toFixed(2),
                (newBalance / 100).toFixed(2)
              )
            );
        } else {
            await bot.sendMessage(chatId, BOT_MESSAGES.requestCompleteFree);
        }

      } else {
        if (totalCost > 0) {
            await updateUserBalance(user.user_id, user.balance_cents);
            bot.sendMessage(
              chatId,
              BOT_MESSAGES.noItemsFoundAndRefund(
                (user.balance_cents / 100).toFixed(2)
              )
            );
        } else {
            bot.sendMessage(chatId, BOT_MESSAGES.noItemsFound);
        }
      }
    } catch (error) {
      console.error('An error occurred during message processing:', error);
      bot.sendMessage(chatId, BOT_MESSAGES.error);
      if (totalCost > 0) {
        await updateUserBalance(user.user_id, user.balance_cents);
        await bot.sendMessage(
          chatId,
          BOT_MESSAGES.refundOnEror((user.balance_cents / 100).toFixed(2))
        );
      }
    }
  });

  bot.onText(/\/balance/, async (msg) => {
    if (!msg.from) return;
    const user = await getUser(msg.from.id);
    const balance = user ? user.balance_cents : 0;
    await bot.sendMessage(msg.chat.id, BOT_MESSAGES.currentBalance((balance / 100).toFixed(2)));
  });

  bot.onText(/\/topup/, (msg) => sendInvoice(bot, msg.chat.id));

  bot.onText(/\/redeem(?: (.+))?/, async (msg, match) => {
    const code = match?.[1]?.trim();
    if (code) {
      await processCouponCode(bot, msg, code);
    } else {
      await bot.sendMessage(msg.chat.id, BOT_MESSAGES.enterCouponCode, {
        reply_markup: { force_reply: true, selective: true },
      });
    }
  });

  bot.onText(/\/generatecoupon(?: (.+))?/, async (msg, match) => {
      if (!msg.from || !isAdmin(msg.from.id)) {
          return bot.sendMessage(msg.chat.id, BOT_MESSAGES.adminOnly);
      }
      const amountStr = match?.[1]?.trim();
      if (amountStr) {
          await processCouponGeneration(bot, msg, amountStr);
      } else {
          await bot.sendMessage(msg.chat.id, BOT_MESSAGES.enterCouponValue, {
              reply_markup: { force_reply: true, selective: true },
          });
      }
  });

  bot.on('callback_query', (query) => {
    if (!query.message) return;
    const chatId = query.message.chat.id;

    if (query.data === 'topup') {
      sendInvoice(bot, chatId);
    } else if (query.data === 'redeem_prompt') {
      bot.sendMessage(chatId, BOT_MESSAGES.enterCouponCode, {
        reply_markup: { force_reply: true, selective: true },
      });
    }
    bot.answerCallbackQuery(query.id);
  });

  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });

  console.log('Bot has been initialized and started...');
}
