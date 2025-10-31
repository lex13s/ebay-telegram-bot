import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import { BOT_MESSAGES } from './constants';
import { createCoupon, getCoupon, activateCoupon, updateUserBalance, getOrCreateUser, User } from './database';
import { randomBytes } from 'crypto';

/**
 * Checks if a given user ID belongs to an admin.
 */
export function isAdmin(userId: number): boolean {
    return userId === config.adminId;
}

/**
 * Generates the main inline keyboard for the bot.
 * @param forAdmin If true, includes admin-specific buttons.
 */
export function getMainMenuKeyboard(forAdmin: boolean): TelegramBot.InlineKeyboardMarkup {
    const keyboard: TelegramBot.InlineKeyboardButton[][] = [
        [
            { text: '💰 Баланс', callback_data: 'check_balance' },
            { text: '💳 Пополнить', callback_data: 'topup' },
        ],
        [
            { text: '🎁 Активировать купон', callback_data: 'redeem_prompt' },
            { text: '⚙️ Настройки поиска', callback_data: 'search_settings' },
        ]
    ];

    if (forAdmin) {
        keyboard[1].push({ text: '🛠️ Создать купон', callback_data: 'generate_coupon_prompt' });
    }

    return { inline_keyboard: keyboard };
}

/**
 * Generates the search settings keyboard.
 * @param currentUserConfig The user's current search configuration key.
 */
export function getSearchSettingsKeyboard(currentUserConfig: string): TelegramBot.InlineKeyboardMarkup {
    const searchTypes = [
        { text: '🟢 Активные', key: 'ACTIVE' },
        { text: '🔴 Проданные', key: 'SOLD' },
        { text: '⚫ Завершенные', key: 'ENDED' },
    ];

    const keyboard: TelegramBot.InlineKeyboardButton[][] = [searchTypes.map(type => ({
        text: currentUserConfig === type.key ? `✅ ${type.text}` : type.text,
        callback_data: `set_search_config_${type.key}`,
    }))];

    keyboard.push([{ text: '⬅️ Назад', callback_data: 'back_to_main_menu' }]);

    return { inline_keyboard: keyboard };
}


/**
 * Processes a coupon code, validates it, and updates the user's balance.
 */
export async function processCouponCode(bot: TelegramBot, msg: TelegramBot.Message, code: string) {
    if (!msg.from) return;

    // First, explicitly remove any lingering reply keyboard.
    const tempMsg = await bot.sendMessage(msg.chat.id, 'Обработка...', { reply_markup: { remove_keyboard: true } });
    await bot.deleteMessage(msg.chat.id, tempMsg.message_id);

    const coupon = await getCoupon(code.trim());
    const userIsAdmin = isAdmin(msg.from.id);

    if (!coupon || coupon.is_activated) {
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.redeemCouponNotFound);
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.mainMenu(((await getOrCreateUser(msg.from.id)).balance_cents / 100).toFixed(2)), {
            reply_markup: getMainMenuKeyboard(userIsAdmin)
        });
        return;
    }

    const user = await getOrCreateUser(msg.from.id, msg.from.username);
    const newBalance = user.balance_cents + coupon.value_cents;

    await activateCoupon(code, user.user_id);
    await updateUserBalance(user.user_id, newBalance);

    await bot.sendMessage(
        msg.chat.id,
        BOT_MESSAGES.redeemCouponSuccess(
            (coupon.value_cents / 100).toFixed(2),
            (newBalance / 100).toFixed(2)
        )
    );
    await bot.sendMessage(msg.chat.id, BOT_MESSAGES.mainMenu((newBalance / 100).toFixed(2)), {
        reply_markup: getMainMenuKeyboard(userIsAdmin)
    });
}

/**
 * Processes a request to generate a new coupon.
 */
export async function processCouponGeneration(bot: TelegramBot, msg: TelegramBot.Message, amountStr: string) {
    const userIsAdmin = isAdmin(msg.from!.id);
    if (!userIsAdmin) {
        return bot.sendMessage(msg.chat.id, BOT_MESSAGES.adminOnly);
    }

    // First, explicitly remove any lingering reply keyboard.
    const tempMsg = await bot.sendMessage(msg.chat.id, 'Создание купона...', { reply_markup: { remove_keyboard: true } });
    await bot.deleteMessage(msg.chat.id, tempMsg.message_id);

    const valueDollars = parseFloat(amountStr.trim());
    if (isNaN(valueDollars) || valueDollars <= 0) {
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.generateCouponUsage);
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.mainMenu(((await getOrCreateUser(msg.from!.id)).balance_cents / 100).toFixed(2)), {
            reply_markup: getMainMenuKeyboard(true)
        });
        return;
    }

    const valueCents = Math.round(valueDollars * 100);
    const code = `C-${randomBytes(4).toString('hex').toUpperCase()}`;

    try {
        await createCoupon(code, valueCents);
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.generateCouponSuccess(code, valueDollars.toFixed(2)), {
            parse_mode: 'Markdown',
            reply_markup: getMainMenuKeyboard(true)
        });
    } catch (error) {
        console.error("Coupon generation failed:", error);
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.generateCouponError);
    }

    const user = await getOrCreateUser(msg.from!.id);
    await bot.sendMessage(msg.chat.id, BOT_MESSAGES.mainMenu((user.balance_cents / 100).toFixed(2)), {
        reply_markup: getMainMenuKeyboard(true)
    });
}

export function getIsoDateMinusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
