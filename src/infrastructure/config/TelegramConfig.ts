import { EnvConfig } from './EnvConfig';

/**
 * Telegram bot configuration
 */
export interface TelegramConfig {
  token: string;
  adminId: number;
}

export function createTelegramConfig(env: EnvConfig): TelegramConfig {
  return {
    token: env.TELEGRAM_BOT_TOKEN,
    adminId: env.ADMIN_USER_ID,
  };
}

