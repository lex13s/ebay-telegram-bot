import TelegramBot from 'node-telegram-bot-api';
import { findItem } from './ebay';
import { createExcelReport } from './excel';
import { BOT_MESSAGES, FILE_NAME_PREFIX, START_COMMAND_REGEX, PART_NUMBER_DELIMITER_REGEX } from './constants';
import { config } from './config';
import { getOrCreateUser, getUser, updateUserBalance } from './database';
import { sendInvoice, registerPaymentHandlers } from './paymentHandlers';
import {
    isAdmin,
    getMainMenuKeyboard,
    processCouponCode,
    processCouponGeneration
} from './utils';

export function initializeBot(): void {
  // Set polling to false initially to start it manually in a try-catch block
  const bot = new TelegramBot(config.telegramToken, { polling: false });

  if (config.paymentsEnabled) {
    registerPaymentHandlers(bot);
    console.log('Payment handlers have been registered.');
  }

  // Main command handler: /start
  bot.onText(START_COMMAND_REGEX, async (msg: TelegramBot.Message) => {
    if (!msg.from) return;
    const user = await getOrCreateUser(msg.from.id, msg.from.username);
    const userIsAdmin = isAdmin(user.user_id);

    try {
        // 1. Send a welcome message and explicitly remove the old reply keyboard
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.start(msg.from.first_name), {
            reply_markup: { remove_keyboard: true },
        });
    } catch (error) {
        // Ignore if message is not modified, otherwise rethrow
        if (error instanceof Error && error.message.includes('message is not modified')) {
            // Do nothing, message is already there
        } else {
            console.error('Error sending welcome message:', error);
        }
    }

    try {
        // 2. Send the main menu with the new inline keyboard
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.mainMenu((user.balance_cents / 100).toFixed(2)), {
            reply_markup: getMainMenuKeyboard(userIsAdmin)
        });
    } catch (error) {
        // Ignore if message is not modified, otherwise rethrow
        if (error instanceof Error && error.message.includes('message is not modified')) {
            // Do nothing, message is already there
        } else {
            console.error('Error sending main menu:', error);
        }
    }
  });

  // Main message handler for part numbers and replies
  bot.on('message', async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Handle replies to our prompts (for coupons)
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

    // Ignore commands in the general message handler
    if (!text || text.startsWith('/')) {
      return;
    }

    // --- Part Number Processing Logic ---
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
    await bot.sendMessage(chatId, BOT_MESSAGES.processing);

    try {
      let newBalance = user.balance_cents;
      if (totalCost > 0) {
        newBalance = user.balance_cents - totalCost;
        await updateUserBalance(user.user_id, newBalance);
      }

      await bot.sendMessage(chatId, (BOT_MESSAGES as any).searching(partNumbers.length));

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
        await bot.sendMessage(chatId, BOT_MESSAGES.searchComplete);

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
        
        const finalMessage = totalCost > 0 
            ? BOT_MESSAGES.requestComplete((totalCost / 100).toFixed(2), (newBalance / 100).toFixed(2))
            : BOT_MESSAGES.requestCompleteFree;
        
        await bot.sendMessage(chatId, finalMessage);
        // Also send the main menu again after a successful search
        await bot.sendMessage(chatId, BOT_MESSAGES.mainMenu((newBalance / 100).toFixed(2)), {
            reply_markup: getMainMenuKeyboard(userIsAdmin)
        });

      } else {
        const finalMessage = totalCost > 0
            ? BOT_MESSAGES.noItemsFoundAndRefund((user.balance_cents / 100).toFixed(2))
            : BOT_MESSAGES.noItemsFound;

        if (totalCost > 0) {
            await updateUserBalance(user.user_id, user.balance_cents);
        }

        await bot.sendMessage(chatId, finalMessage);
        // Resend main menu on failure too
        const updatedUser = await getUser(user.user_id);
        const currentBalance = updatedUser ? updatedUser.balance_cents : user.balance_cents;
        await bot.sendMessage(chatId, BOT_MESSAGES.mainMenu((currentBalance / 100).toFixed(2)), {
            reply_markup: getMainMenuKeyboard(userIsAdmin)
        });
      }
    } catch (error) {
      console.error('An error occurred during message processing:', error);
      await bot.sendMessage(chatId, BOT_MESSAGES.error);
      if (totalCost > 0) {
        await updateUserBalance(user.user_id, user.balance_cents);
      }
    }
  });

  // Central handler for all button clicks
  bot.on('callback_query', async (query) => {
    if (!query.message || !query.from) return;

    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const userIsAdmin = isAdmin(userId);

    switch (query.data) {
        case 'check_balance':
            const user = await getUser(userId);
            const balance = user ? user.balance_cents : 0;
            // Send a new message with the balance and keyboard
            try {
                await bot.sendMessage(chatId, BOT_MESSAGES.currentBalance((balance / 100).toFixed(2)), {
                    reply_markup: getMainMenuKeyboard(userIsAdmin)
                });
            } catch (error) {
                console.error('Error sending balance message:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка при получении баланса. Пожалуйста, попробуйте позже.');
            }
            break;

        case 'topup':
            sendInvoice(bot, chatId);
            break;

        case 'redeem_prompt':
            await bot.sendMessage(chatId, BOT_MESSAGES.enterCouponCode, {
                reply_markup: { force_reply: true, selective: true },
            });
            break;

        case 'generate_coupon_prompt':
            if (!userIsAdmin) return bot.answerCallbackQuery(query.id, { text: BOT_MESSAGES.adminOnly });
            await bot.sendMessage(chatId, BOT_MESSAGES.enterCouponValue, {
                reply_markup: { force_reply: true, selective: true },
            });
            break;
    }

    bot.answerCallbackQuery(query.id);
  });

  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });

  console.log('Bot has been initialized and started...');

  // Manually start polling after all handlers are set up
  try {
    bot.startPolling();
    console.log('Bot polling started.');
  } catch (error) {
    console.error('Error starting bot polling:', error);
  }
}