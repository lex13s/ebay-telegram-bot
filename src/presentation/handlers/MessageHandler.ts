import TelegramBot from 'node-telegram-bot-api';
import { UserId, PartNumber, CouponCode, InsufficientFundsError } from '../../domain';
import { ProcessSearchUseCase, RedeemCouponUseCase, GenerateCouponUseCase, UserService } from '../../application';
import { TelegramBotAdapter, ExcelReportGenerator, ILogger } from '../../infrastructure';
import { KeyboardBuilder, MessageTemplates } from '..';
import { RegexPatterns, FileConstants } from '../../shared/constants';
import { formatCents } from '../../shared/utils';

/**
 * Handler for text messages
 */
export class MessageHandler {
  constructor(
    private readonly botAdapter: TelegramBotAdapter,
    private readonly userService: UserService,
    private readonly processSearchUseCase: ProcessSearchUseCase,
    private readonly redeemCouponUseCase: RedeemCouponUseCase,
    private readonly generateCouponUseCase: GenerateCouponUseCase,
    private readonly excelGenerator: ExcelReportGenerator,
    private readonly logger: ILogger
  ) {}

  public register(): void {
    const bot = this.botAdapter.getBot();

    bot.on('message', async (msg: TelegramBot.Message) => {
      // Skip commands
      if (msg.text?.startsWith('/')) return;

      await this.handle(msg);
    });
  }

  private async handle(msg: TelegramBot.Message): Promise<void> {
    if (!msg.from || !msg.text) return;

    const bot = this.botAdapter.getBot();

    try {
      // Handle coupon code input
      if (msg.reply_to_message?.text === MessageTemplates.enterCouponCode()) {
        await this.handleCouponRedemption(msg);
        return;
      }

      // Handle coupon generation input (admin)
      if (msg.reply_to_message?.text === MessageTemplates.enterCouponValue()) {
        await this.handleCouponGeneration(msg);
        return;
      }

      // Handle search request
      await this.handleSearchRequest(msg);
    } catch (error) {
      this.logger.error('Failed to handle message', error as Error, {
        userId: msg.from.id,
      });
      await bot.sendMessage(msg.chat.id, MessageTemplates.error());
    }
  }

  private async handleSearchRequest(msg: TelegramBot.Message): Promise<void> {
    if (!msg.from || !msg.text) return;

    const bot = this.botAdapter.getBot();
    const userId = UserId.create(msg.from.id);
    const isAdmin = this.botAdapter.isAdmin(msg.from.id);

    // Parse part numbers
    const partNumberStrings = msg.text
      .split(RegexPatterns.PART_NUMBER_DELIMITER)
      .filter((pn) => pn.trim().length > 0);

    if (partNumberStrings.length === 0) {
      await bot.sendMessage(msg.chat.id, MessageTemplates.noPartNumbers());
      return;
    }

    const partNumbers = partNumberStrings.map((pn) => PartNumber.create(pn));

    try {
      await bot.sendMessage(msg.chat.id, MessageTemplates.processing());
      await bot.sendMessage(msg.chat.id, MessageTemplates.searching(partNumbers.length));

      // Execute search
      const response = await this.processSearchUseCase.execute({
        userId,
        username: msg.from.username || null,
        partNumbers,
        isAdmin,
      });

      const foundResults = response.results.filter((r) => r.isFound());

      if (foundResults.length > 0) {
        // Generate and send Excel report
        await bot.sendMessage(msg.chat.id, MessageTemplates.searchComplete());

        const reportBuffer = await this.excelGenerator.generate(foundResults);
        const fileName = `${FileConstants.EXCEL_FILE_PREFIX}${Date.now()}.xlsx`;

        await bot.sendDocument(
          msg.chat.id,
          reportBuffer,
          {},
          {
            filename: fileName,
            contentType: FileConstants.EXCEL_CONTENT_TYPE,
          }
        );

        // Send completion message
        const completionMessage = isAdmin
          ? MessageTemplates.requestCompleteFree()
          : MessageTemplates.requestComplete(
              formatCents(response.cost.getCents()),
              formatCents(response.newBalance.getCents())
            );

        await bot.sendMessage(msg.chat.id, completionMessage);
      } else {
        // No results found
        const noResultsMessage = isAdmin || response.refunded
          ? response.refunded
            ? MessageTemplates.noItemsFoundAndRefund(formatCents(response.newBalance.getCents()))
            : MessageTemplates.noItemsFound()
          : MessageTemplates.noItemsFound();

        await bot.sendMessage(msg.chat.id, noResultsMessage);
      }

      // Send main menu
      const user = await this.userService.getUser(userId);
      await bot.sendMessage(
        msg.chat.id,
        MessageTemplates.mainMenu(formatCents(user.getBalance().getCents())),
        { reply_markup: KeyboardBuilder.createMainMenu(isAdmin) }
      );
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        await bot.sendMessage(msg.chat.id, MessageTemplates.insufficientFunds(), {
          reply_markup: KeyboardBuilder.createInsufficientFunds(),
        });
      } else {
        throw error;
      }
    }
  }

  private async handleCouponRedemption(msg: TelegramBot.Message): Promise<void> {
    if (!msg.from || !msg.text) return;

    const bot = this.botAdapter.getBot();
    const userId = UserId.create(msg.from.id);
    const isAdmin = this.botAdapter.isAdmin(msg.from.id);

    // Remove reply keyboard
    const tempMsg = await bot.sendMessage(msg.chat.id, 'Обработка...', {
      reply_markup: KeyboardBuilder.createRemoveKeyboard(),
    });
    await bot.deleteMessage(msg.chat.id, tempMsg.message_id);

    try {
      const couponCode = CouponCode.create(msg.text);

      const response = await this.redeemCouponUseCase.execute({
        userId,
        username: msg.from.username || null,
        couponCode,
      });

      await bot.sendMessage(
        msg.chat.id,
        MessageTemplates.redeemCouponSuccess(
          formatCents(response.addedBalance.getCents()),
          formatCents(response.newBalance.getCents())
        )
      );
    } catch (error) {
      await bot.sendMessage(msg.chat.id, MessageTemplates.redeemCouponNotFound());
    }

    // Send main menu
    const user = await this.userService.getUser(userId);
    await bot.sendMessage(
      msg.chat.id,
      MessageTemplates.mainMenu(formatCents(user.getBalance().getCents())),
      { reply_markup: KeyboardBuilder.createMainMenu(isAdmin) }
    );
  }

  private async handleCouponGeneration(msg: TelegramBot.Message): Promise<void> {
    if (!msg.from || !msg.text) return;

    const bot = this.botAdapter.getBot();
    const userId = UserId.create(msg.from.id);
    const isAdmin = this.botAdapter.isAdmin(msg.from.id);

    if (!isAdmin) {
      await bot.sendMessage(msg.chat.id, MessageTemplates.adminOnly());
      return;
    }

    // Remove reply keyboard
    const tempMsg = await bot.sendMessage(msg.chat.id, 'Создание купона...', {
      reply_markup: KeyboardBuilder.createRemoveKeyboard(),
    });
    await bot.deleteMessage(msg.chat.id, tempMsg.message_id);

    const valueInDollars = parseFloat(msg.text.trim());

    if (isNaN(valueInDollars) || valueInDollars <= 0) {
      await bot.sendMessage(msg.chat.id, 'Invalid amount. Please enter a positive number.');
    } else {
      try {
        const response = await this.generateCouponUseCase.execute({ valueInDollars });

        await bot.sendMessage(
          msg.chat.id,
          MessageTemplates.generateCouponSuccess(
            response.code.getValue(),
            valueInDollars.toFixed(2)
          ),
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        await bot.sendMessage(msg.chat.id, MessageTemplates.generateCouponError());
      }
    }

    // Send main menu
    const user = await this.userService.getUser(userId);
    await bot.sendMessage(
      msg.chat.id,
      MessageTemplates.mainMenu(formatCents(user.getBalance().getCents())),
      { reply_markup: KeyboardBuilder.createMainMenu(isAdmin) }
    );
  }
}

