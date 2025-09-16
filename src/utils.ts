import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import { BOT_MESSAGES } from './constants';
import { createCoupon, getCoupon, activateCoupon, updateUserBalance, getOrCreateUser } from './database';
import { randomBytes } from 'crypto';

/**
 * Checks if a given user ID belongs to an admin.
 */
export function isAdmin(userId: number): boolean {
    return userId === config.adminId;
}

/**
 * Generates the appropriate reply keyboard for a user.
 * @param forAdmin If true, the admin keyboard will be generated.
 */
export function getReplyKeyboard(forAdmin: boolean): TelegramBot.ReplyKeyboardMarkup {
    const keyboard: TelegramBot.KeyboardButton[][] = [
        [{ text: '/balance 💰' }, { text: '/topup 💳' }],
        [{ text: '/redeem' }],
    ];

    if (forAdmin) {
        keyboard[1].push({ text: '/generatecoupon' });
    }

    return {
        keyboard: keyboard,
        resize_keyboard: true,
    };
}

/**
 * Processes a coupon code, validates it, and updates the user's balance.
 */
export async function processCouponCode(bot: TelegramBot, msg: TelegramBot.Message, code: string) {
    if (!msg.from) return;

    const coupon = await getCoupon(code.trim());
    if (!coupon || coupon.is_activated) {
        // On failure, also resend the keyboard to prevent it from disappearing
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.redeemCouponNotFound, {
            reply_markup: getReplyKeyboard(isAdmin(msg.from.id))
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
        ),
        // On success, resend the keyboard
        { reply_markup: getReplyKeyboard(isAdmin(user.user_id)) }
    );
}

/**
 * Processes a request to generate a new coupon.
 */
export async function processCouponGeneration(bot: TelegramBot, msg: TelegramBot.Message, amountStr: string) {
    if (!isAdmin(msg.from!.id)) {
        return bot.sendMessage(msg.chat.id, BOT_MESSAGES.adminOnly);
    }

    const valueDollars = parseFloat(amountStr.trim());
    if (isNaN(valueDollars) || valueDollars <= 0) {
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.generateCouponUsage, {
            reply_markup: getReplyKeyboard(true)
        });
        return;
    }

    const valueCents = Math.round(valueDollars * 100);
    const code = `C-${randomBytes(4).toString('hex').toUpperCase()}`;

    try {
        await createCoupon(code, valueCents);
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.generateCouponSuccess(code, valueDollars.toFixed(2)), {
            parse_mode: 'Markdown',
            reply_markup: getReplyKeyboard(true)
        });
    } catch (error) {
        console.error("Coupon generation failed:", error);
        await bot.sendMessage(msg.chat.id, BOT_MESSAGES.generateCouponError, {
            reply_markup: getReplyKeyboard(true)
        });
    }
}
