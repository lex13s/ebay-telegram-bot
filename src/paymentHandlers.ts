import TelegramBot from "node-telegram-bot-api";
import { config } from "./config";
import { getOrCreateUser, updateUserBalance } from "./database";
import { BOT_MESSAGES } from "./constants";

export async function sendInvoice(bot: TelegramBot, chatId: number) {
    const title = BOT_MESSAGES.invoiceTitle;
    const description = BOT_MESSAGES.invoiceDescription((config.paymentAmountCents / 100).toFixed(2));
    const payload = `payment_${chatId}_${Date.now()}`;
    const prices: TelegramBot.LabeledPrice[] = [
        { label: title, amount: config.paymentAmountCents },
    ];

    await bot.sendInvoice(
        chatId,
        title,
        description,
        payload,
        config.stripeToken,
        config.paymentCurrency,
        prices
    );
}

export function registerPaymentHandlers(bot: TelegramBot) {
    // Ответ на запрос перед списанием средств
    bot.on('pre_checkout_query', (query) => {
        // Здесь можно добавить проверки, если нужно
        bot.answerPreCheckoutQuery(query.id, true);
    });

    // Обработка успешного платежа
    bot.on('successful_payment', async (msg) => {
        if (!msg.from || !msg.successful_payment) return;

        const userId = msg.from.id;
        const user = await getOrCreateUser(userId);

        // В нашей модели цена = количеству кредитов (1 цент = 1 кредит)
        const amountToAdd = msg.successful_payment.total_amount;

        const newBalance = user.balance_cents + amountToAdd;
        await updateUserBalance(userId, newBalance);

        await bot.sendMessage(
            userId,
            BOT_MESSAGES.paymentSuccess(
                (amountToAdd / 100).toFixed(2),
                (newBalance / 100).toFixed(2)
            )
        );
    });
}