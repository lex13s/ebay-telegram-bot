import TelegramBot from 'node-telegram-bot-api';
import { TelegramConfig } from '../config';
import { ILogger } from '../logging';

export class TelegramBotAdapter {
  private readonly bot: TelegramBot;

  constructor(
    private readonly config: TelegramConfig,
    private readonly logger: ILogger
  ) {
    this.bot = new TelegramBot(config.token, { polling: false });
    this.logger.info('Telegram bot adapter initialized');
  }

  public getBot(): TelegramBot {
    return this.bot;
  }

  public async startPolling(): Promise<void> {
    try {
      await this.bot.startPolling();
      this.logger.info('Telegram bot polling started');
    } catch (error) {
      this.logger.error('Failed to start Telegram bot polling', error as Error);
      throw error;
    }
  }

  public async stopPolling(): Promise<void> {
    try {
      await this.bot.stopPolling();
      this.logger.info('Telegram bot polling stopped');
    } catch (error) {
      this.logger.error('Failed to stop Telegram bot polling', error as Error);
    }
  }

  public isAdmin(userId: number): boolean {
    return userId === this.config.adminId;
  }
}
