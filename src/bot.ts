import TelegramBot from 'node-telegram-bot-api';
import { findItem } from './ebay';
import { createExcelReport } from './excel';
import { BOT_MESSAGES, FILE_NAME_PREFIX, START_COMMAND_REGEX, PART_NUMBER_DELIMITER_REGEX } from './constants';
import { config } from './config';
import { getOrCreateUser, getUser, updateUserBalance, updateUserSearchConfig } from './database';
import { sendInvoice, registerPaymentHandlers } from './paymentHandlers';
import {
    isAdmin,
    getMainMenuKeyboard,
    getSearchSettingsKeyboard,
    processCouponCode,
    processCouponGeneration
} from './utils';

// Helper to introduce a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to handle Telegram API errors, especially "message is not modified"
async function handleApiError(error: any, queryId?: string, bot?: TelegramBot) {
    if (error instanceof Error && error.message.includes('message is not modified')) {
        // Ignore this specific error, as it's expected on repeated button clicks
        if (queryId && bot) {
            await bot.answerCallbackQuery(queryId, { text: 'Настройки уже отображены.' });
        }
    } else {
        // In a real application, you would log this to a proper logging service
    }
}

export function initializeBot(): void {
  const bot = new TelegramBot(config.telegramToken, { polling: false });

  if (config.paymentsEnabled) {
    registerPaymentHandlers(bot);
  }

  bot.onText(START_COMMAND_REGEX, async (msg: TelegramBot.Message) => {
    if (!msg.from) return;
    const user = await getOrCreateUser(msg.from.id, msg.from.username);
    const userIsAdmin = isAdmin(user.user_id);

    try {
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.start(msg.from.first_name), {
            reply_markup: { remove_keyboard: true },
        });
    } catch (error) {
        handleApiError(error);
    }

    try {
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.mainMenu((user.balance_cents / 100).toFixed(2)), {
            reply_markup: getMainMenuKeyboard(userIsAdmin)
        });
    } catch (error) {
        handleApiError(error);
    }
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

    if (!text || text.startsWith('/')) return;

    if (!msg.from) return;
    const user = await getOrCreateUser(msg.from.id, msg.from.username);
    const userIsAdmin = isAdmin(user.user_id);

    const partNumbers = text.split(PART_NUMBER_DELIMITER_REGEX).filter((pn) => pn.trim().length > 0);

    if (partNumbers.length === 0) {
      await bot.sendMessage(chatId, BOT_MESSAGES.noPartNumbers);
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

    await bot.sendMessage(chatId, BOT_MESSAGES.processing);

    try {
      let newBalance = user.balance_cents;
      if (totalCost > 0) {
        newBalance = user.balance_cents - totalCost;
        await updateUserBalance(user.user_id, newBalance);
      }

      await bot.sendMessage(chatId, (BOT_MESSAGES as any).searching(partNumbers.length));

      // Вызываем findItem один раз с массивом partNumbers
      const allResults = await findItem(partNumbers, user.search_config_key || 'SOLD');

      const rawResults = allResults.map(res => ({
          partNumber: res.partNumber,
          title: res.result ? res.result.title : 'Not Found',
          price: res.result ? res.result.price : 'N/A',
          found: !!res.result,
      }));

      const successfulResults = rawResults.filter((result) => result.found);

      if (successfulResults.length > 0) {
        await bot.sendMessage(chatId, BOT_MESSAGES.searchComplete);

        const reportBuffer = await createExcelReport(successfulResults);
        const fileName = `${FILE_NAME_PREFIX}${Date.now()}.xlsx`;

        await bot.sendDocument(chatId, reportBuffer, {}, { filename: fileName, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const finalMessage = totalCost > 0
            ? BOT_MESSAGES.requestComplete((totalCost / 100).toFixed(2), (newBalance / 100).toFixed(2))
            : BOT_MESSAGES.requestCompleteFree;

        await bot.sendMessage(chatId, finalMessage);
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
        const updatedUser = await getUser(user.user_id);
        const currentBalance = updatedUser ? updatedUser.balance_cents : user.balance_cents;
        await bot.sendMessage(chatId, BOT_MESSAGES.mainMenu((currentBalance / 100).toFixed(2)), {
            reply_markup: getMainMenuKeyboard(userIsAdmin)
        });
      }
    } catch (error) {
      await bot.sendMessage(chatId, BOT_MESSAGES.error);
      if (totalCost > 0) {
        await updateUserBalance(user.user_id, user.balance_cents);
      }
      const updatedUser = await getUser(user.user_id);
      const currentBalance = updatedUser ? updatedUser.balance_cents : user.balance_cents;
      await bot.sendMessage(chatId, BOT_MESSAGES.mainMenu((currentBalance / 100).toFixed(2)), {
          reply_markup: getMainMenuKeyboard(userIsAdmin)
      });
    }
  });

  bot.on('callback_query', async (query) => {
    if (!query.message || !query.from) return;

    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const userIsAdmin = isAdmin(userId);
    const data = query.data;

    if (data && data.startsWith('set_search_config_')) {
        const newConfigKey = data.replace('set_search_config_', '');
        await updateUserSearchConfig(userId, newConfigKey);
        const updatedUser = await getUser(userId);
        if (updatedUser) {
            try {
                await bot.editMessageReplyMarkup(getSearchSettingsKeyboard(updatedUser.search_config_key), {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                });
                await bot.answerCallbackQuery(query.id, { text: 'Настройки обновлены!' });
            } catch (error) {
                handleApiError(error, query.id, bot);
            }
        } else {
             await bot.answerCallbackQuery(query.id, { text: 'Пользователь не найден.' });
        }
        return;
    }

    switch (data) {
        case 'check_balance':
            try {
                const user = await getUser(userId);
                const balance = user ? user.balance_cents : 0;
                await bot.sendMessage(chatId, BOT_MESSAGES.currentBalance((balance / 100).toFixed(2)), {
                    reply_markup: getMainMenuKeyboard(userIsAdmin)
                });
            } catch (error) {
                handleApiError(error, query.id, bot);
            }
            await bot.answerCallbackQuery(query.id);
            return;

        case 'topup':
            try {
                await sendInvoice(bot, chatId);
            } catch (error) {
                handleApiError(error, query.id, bot);
            }
            await bot.answerCallbackQuery(query.id);
            return;

        case 'redeem_prompt':
            try {
                await bot.sendMessage(chatId, BOT_MESSAGES.enterCouponCode, {
                    reply_markup: { force_reply: true, selective: true },
                });
            } catch (error) {
                handleApiError(error, query.id, bot);
            }
            await bot.answerCallbackQuery(query.id);
            return;

        case 'generate_coupon_prompt':
            if (!userIsAdmin) {
                await bot.answerCallbackQuery(query.id, { text: BOT_MESSAGES.adminOnly });
                return;
            }
            try {
                await bot.sendMessage(chatId, BOT_MESSAGES.enterCouponValue, {
                    reply_markup: { force_reply: true, selective: true },
                });
            } catch (error) {
                handleApiError(error, query.id, bot);
            }
            await bot.answerCallbackQuery(query.id);
            return;

        case 'search_settings':
            const userForSettings = await getUser(userId);
            if (userForSettings) {
                try {
                    await bot.editMessageText('Выберите тип поиска по умолчанию:', {
                        chat_id: chatId,
                        message_id: query.message.message_id,
                        reply_markup: getSearchSettingsKeyboard(userForSettings.search_config_key)
                    });
                } catch (e) {
                    handleApiError(e, query.id, bot);
                }
            }
            await bot.answerCallbackQuery(query.id);
            return;

        case 'back_to_main_menu':
            const userForMenu = await getUser(userId);
            if (userForMenu) {
                try {
                    await bot.editMessageText(BOT_MESSAGES.mainMenu((userForMenu.balance_cents / 100).toFixed(2)), {
                        chat_id: chatId,
                        message_id: query.message.message_id,
                        reply_markup: getMainMenuKeyboard(userIsAdmin)
                    });
                } catch (e) {
                    handleApiError(e, query.id, bot);
                }
            }
            await bot.answerCallbackQuery(query.id);
            return;
    }
  });

  bot.on('polling_error', (error) => {
    // In a real application, you would log this to a proper logging service
  });

  const startPolling = async () => {
    try {
      await bot.startPolling();
    } catch (error) {
      // In a real application, you would log this to a proper logging service
    }
  };
  startPolling();
}
