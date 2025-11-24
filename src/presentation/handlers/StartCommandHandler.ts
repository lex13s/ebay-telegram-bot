import TelegramBot from 'node-telegram-bot-api';
import { UserId } from '../../domain';
import { UserService } from '../../application';
import { TelegramBotAdapter } from '../../infrastructure';
import { KeyboardBuilder } from '../keyboards';
import { MessageTemplates } from '../messages';
import { ILogger } from '../../infrastructure';
import { formatCents } from '../../shared/utils';

/**
 * Handler for /start command
 */
export class StartCommandHandler {
  constructor(
    private readonly botAdapter: TelegramBotAdapter,
    private readonly userService: UserService,
    private readonly logger: ILogger
  ) {}

  public register(): void {
    const bot = this.botAdapter.getBot();

    bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
      await this.handle(msg);
    });
  }

  private async handle(msg: TelegramBot.Message): Promise<void> {
    if (!msg.from) return;

    try {
      const userId = UserId.create(msg.from.id);
      const user = await this.userService.getOrCreateUser(userId, msg.from.username || null);
      const isAdmin = this.botAdapter.isAdmin(msg.from.id);

      const bot = this.botAdapter.getBot();

      // Send welcome message
      await bot.sendMessage(msg.chat.id, MessageTemplates.start(msg.from.first_name), {
        reply_markup: KeyboardBuilder.createRemoveKeyboard(),
      });

      // Send main menu
      await bot.sendMessage(
        msg.chat.id,
        MessageTemplates.mainMenu(formatCents(user.getBalance().getCents())),
        { reply_markup: KeyboardBuilder.createMainMenu(isAdmin) }
      );

      this.logger.info('Start command handled', { userId: userId.getValue() });
    } catch (error) {
      this.logger.error('Failed to handle start command', error as Error, {
        userId: msg.from.id,
      });
    }
  }
}
