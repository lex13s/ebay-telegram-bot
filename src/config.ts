import dotenv from 'dotenv';

dotenv.config();

function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Переменная окружения ${key} не установлена!`);
    }
    return value;
}

export const config = {
    telegramToken: getEnvVariable('TELEGRAM_BOT_TOKEN'),
    stripeToken: getEnvVariable('STRIPE_PROVIDER_TOKEN'),
    adminId: parseInt(getEnvVariable('ADMIN_USER_ID'), 10),

    dbName: 'bot_database.sqlite',

    trialBalanceCents: 100, // $1 стартовый баланс для новых пользователей
    costPerRequestCents: 1, // 1 цент за один "платный" запрос
    paymentAmountCents: 200, // $2.00 - сумма пополнения по умолчанию
    paymentCurrency: 'USD',
};
