import dotenv from 'dotenv';

dotenv.config();

function getRequiredEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Обязательная переменная окружения ${key} не установлена!`);
    }
    return value;
}

function getOptionalEnvVariable(key: string): string | undefined {
    return process.env[key];
}

const stripeToken = getOptionalEnvVariable('STRIPE_PROVIDER_TOKEN');

export const config = {
    telegramToken: getRequiredEnvVariable('TELEGRAM_BOT_TOKEN'),
    adminId: parseInt(getRequiredEnvVariable('ADMIN_USER_ID'), 10),

    stripeToken: stripeToken,

    paymentsEnabled: !!stripeToken,

    dbName: 'bot_database.sqlite',

    trialBalanceCents: 100, // $1 стартовый баланс для новых пользователей
    costPerRequestCents: 1, // 1 цент за один "платный" запрос
    paymentAmountCents: 200, // $2.00 - сумма пополнения по умолчанию
    paymentCurrency: 'USD',
};
