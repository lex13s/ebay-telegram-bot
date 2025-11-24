import TelegramBot from 'node-telegram-bot-api';
import { UserId } from '../../domain/value-objects/UserId';
import { Balance } from '../../domain/value-objects/Balance';
import { UserService } from '../../application/services/UserService';
import { TelegramBotAdapter } from '../../infrastructure/telegram/TelegramBotAdapter';
import { MessageTemplates } from '../messages/MessageTemplates';
import { formatCents } from '../../shared/utils';
import { ILogger } from '../../infrastructure/logging/Logger';

/**
 * Handler for payment-related events
 */
export class PaymentHandler {
  constructor(
    private readonly botAdapter: TelegramBotAdapter,
    private readonly userService: UserService,
    private readonly logger: ILogger
  ) {}

  public register(): void {
    const bot = this.botAdapter.getBot();

    // Pre-checkout query handler
    bot.on('pre_checkout_query', (query) => {
      bot.answerPreCheckoutQuery(query.id, true);
    });

    // Successful payment handler
    bot.on('successful_payment', async (msg: TelegramBot.Message) => {
      await this.handleSuccessfulPayment(msg);
    });
  }

  private async handleSuccessfulPayment(msg: TelegramBot.Message): Promise<void> {
    if (!msg.from || !msg.successful_payment) return;

    const bot = this.botAdapter.getBot();
    const userId = UserId.create(msg.from.id);

    try {
      const user = await this.userService.getUser(userId);
      const amountToAdd = Balance.create(msg.successful_payment.total_amount);

      const newBalance = user.getBalance().add(amountToAdd);
      await this.userService.updateBalance(userId, newBalance);

      await bot.sendMessage(
        msg.chat.id,
        MessageTemplates.paymentSuccess(
          formatCents(amountToAdd.getCents()),
          formatCents(newBalance.getCents())
        )
      );

      this.logger.info('Payment processed successfully', {
        userId: userId.getValue(),
        amount: amountToAdd.getCents(),
      });
    } catch (error) {
      this.logger.error('Failed to process payment', error as Error, {
        userId: msg.from.id,
      });
    }
  }
}
