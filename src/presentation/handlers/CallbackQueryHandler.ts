import TelegramBot from 'node-telegram-bot-api';
import { UserId, SearchConfigKey } from '../../domain';
import { UpdateSearchSettingsUseCase, UserService } from '../../application';
import { TelegramBotAdapter, AppConfig, PaymentConfig, ILogger } from '../../infrastructure';
import { KeyboardBuilder, MessageTemplates } from '..';
import { formatCents } from '../../shared/utils';

/**
 * Handler for callback queries (inline keyboard button clicks)
 */
export class CallbackQueryHandler {
  constructor(
    private readonly botAdapter: TelegramBotAdapter,
    private readonly userService: UserService,
    private readonly updateSearchSettingsUseCase: UpdateSearchSettingsUseCase,
    private readonly appConfig: AppConfig,
    private readonly paymentConfig: PaymentConfig,
    private readonly logger: ILogger
  ) {}

  public register(): void {
    const bot = this.botAdapter.getBot();

    bot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
      await this.handle(query);
    });
  }

  private async handle(query: TelegramBot.CallbackQuery): Promise<void> {
    if (!query.message || !query.from || !query.data) return;

    const bot = this.botAdapter.getBot();
    const chatId = query.message.chat.id;
    const userId = UserId.create(query.from.id);
    const isAdmin = this.botAdapter.isAdmin(query.from.id);
    const data = query.data;

    try {
      // Handle search config update
      if (data.startsWith('set_search_config_')) {
        const configKeyStr = data.replace('set_search_config_', '');
        const configKey = SearchConfigKey.create(configKeyStr);

        await this.updateSearchSettingsUseCase.execute({ userId, newConfigKey: configKey });

        const user = await this.userService.getUser(userId);

        try {
          await bot.editMessageReplyMarkup(
            KeyboardBuilder.createSearchSettings(user.getSearchConfigKey()),
            {
              chat_id: chatId,
              message_id: query.message.message_id,
            }
          );
          await bot.answerCallbackQuery(query.id, { text: 'Settings updated!' });
        } catch (error) {
          // Ignore "message is not modified" error
          this.handleTelegramApiError(error, query.id);
        }

        return;
      }

      // Handle other callbacks
      switch (data) {
        case 'check_balance':
          await this.handleCheckBalance(query, userId, isAdmin);
          break;
        case 'topup':
          await this.handleTopUp(query, chatId);
          break;
        case 'redeem_prompt':
          await this.handleRedeemPrompt(query, chatId);
          break;
        case 'generate_coupon_prompt':
          await this.handleGenerateCouponPrompt(query, chatId, isAdmin);
          break;
        case 'search_settings':
          await this.handleSearchSettings(query, chatId, userId);
          break;
        case 'back_to_main_menu':
          await this.handleBackToMainMenu(query, chatId, userId, isAdmin);
          break;
        default:
          await bot.answerCallbackQuery(query.id);
      }
    } catch (error) {
      this.logger.error('Failed to handle callback query', error as Error, {
        userId: query.from.id,
        data,
      });
      await bot.answerCallbackQuery(query.id, { text: 'An error occurred' });
    }
  }

  private async handleCheckBalance(
    query: TelegramBot.CallbackQuery,
    userId: UserId,
    isAdmin: boolean
  ): Promise<void> {
    const bot = this.botAdapter.getBot();
    const chatId = query.message!.chat.id;

    const user = await this.userService.getUser(userId);

    await bot.sendMessage(
      chatId,
      MessageTemplates.currentBalance(formatCents(user.getBalance().getCents())),
      { reply_markup: KeyboardBuilder.createMainMenu(isAdmin) }
    );

    await bot.answerCallbackQuery(query.id);
  }

  private async handleTopUp(query: TelegramBot.CallbackQuery, chatId: number): Promise<void> {
    const bot = this.botAdapter.getBot();

    if (!this.paymentConfig.enabled || !this.paymentConfig.stripeToken) {
      await bot.sendMessage(chatId, MessageTemplates.paymentsDisabled());
      await bot.answerCallbackQuery(query.id);
      return;
    }

    const title = MessageTemplates.invoiceTitle();
    const description = MessageTemplates.invoiceDescription(
      formatCents(this.appConfig.payments.amountCents)
    );
    const payload = `payment_${chatId}_${Date.now()}`;
    const prices: TelegramBot.LabeledPrice[] = [
      { label: title, amount: this.appConfig.payments.amountCents },
    ];

    await bot.sendInvoice(
      chatId,
      title,
      description,
      payload,
      this.paymentConfig.stripeToken,
      this.appConfig.payments.currency,
      prices
    );

    await bot.answerCallbackQuery(query.id);
  }

  private async handleRedeemPrompt(query: TelegramBot.CallbackQuery, chatId: number): Promise<void> {
    const bot = this.botAdapter.getBot();

    await bot.sendMessage(chatId, MessageTemplates.enterCouponCode(), {
      reply_markup: KeyboardBuilder.createForceReply(),
    });

    await bot.answerCallbackQuery(query.id);
  }

  private async handleGenerateCouponPrompt(
    query: TelegramBot.CallbackQuery,
    chatId: number,
    isAdmin: boolean
  ): Promise<void> {
    const bot = this.botAdapter.getBot();

    if (!isAdmin) {
      await bot.answerCallbackQuery(query.id, { text: MessageTemplates.adminOnly() });
      return;
    }

    await bot.sendMessage(chatId, MessageTemplates.enterCouponValue(), {
      reply_markup: KeyboardBuilder.createForceReply(),
    });

    await bot.answerCallbackQuery(query.id);
  }

  private async handleSearchSettings(
    query: TelegramBot.CallbackQuery,
    chatId: number,
    userId: UserId
  ): Promise<void> {
    const bot = this.botAdapter.getBot();

    const user = await this.userService.getUser(userId);

    try {
      await bot.editMessageText('Select default search type:', {
        chat_id: chatId,
        message_id: query.message!.message_id,
        reply_markup: KeyboardBuilder.createSearchSettings(user.getSearchConfigKey()),
      });
    } catch (error) {
      this.handleTelegramApiError(error, query.id);
    }

    await bot.answerCallbackQuery(query.id);
  }

  private async handleBackToMainMenu(
    query: TelegramBot.CallbackQuery,
    chatId: number,
    userId: UserId,
    isAdmin: boolean
  ): Promise<void> {
    const bot = this.botAdapter.getBot();

    const user = await this.userService.getUser(userId);

    try {
      await bot.editMessageText(
        MessageTemplates.mainMenu(formatCents(user.getBalance().getCents())),
        {
          chat_id: chatId,
          message_id: query.message!.message_id,
          reply_markup: KeyboardBuilder.createMainMenu(isAdmin),
        }
      );
    } catch (error) {
      this.handleTelegramApiError(error, query.id);
    }

    await bot.answerCallbackQuery(query.id);
  }

  private async handleTelegramApiError(error: any, queryId?: string): Promise<void> {
    if (error instanceof Error && error.message.includes('message is not modified')) {
      // Ignore this specific error
      if (queryId) {
        const bot = this.botAdapter.getBot();
        await bot.answerCallbackQuery(queryId, { text: 'Settings are already displayed.' });
      }
    } else {
      this.logger.warn('Telegram API error', { error: error?.message });
    }
  }
}

