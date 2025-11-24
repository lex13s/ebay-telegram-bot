import dotenv from 'dotenv';
dotenv.config();

import { Balance } from './domain';
import {
  loadEnv,
  createAppConfig,
  createTelegramConfig,
  createEbayConfig,
  createPaymentConfig,
} from './infrastructure';
import { createLogger, ILogger } from './infrastructure';
import { DatabaseConnection, SqliteUserRepository, SqliteCouponRepository } from './infrastructure';
import { EbayBrowseApiClient, EbayFindingApiClient } from './infrastructure';
import { ExcelReportGenerator } from './infrastructure';
import { TelegramBotAdapter } from './infrastructure';
import { UserService, CouponService, EbaySearchService } from './application';
import {
  ProcessSearchUseCase,
  RedeemCouponUseCase,
  GenerateCouponUseCase,
  UpdateSearchSettingsUseCase,
} from './application';
import {
  StartCommandHandler,
  MessageHandler,
  CallbackQueryHandler,
  PaymentHandler,
} from './presentation';

/**
 * Main application class
 */
class Application {
  private logger!: ILogger;
  private dbConnection!: DatabaseConnection;
  private botAdapter!: TelegramBotAdapter;

  /**
   * Initialize and start the application
   */
  public async start(): Promise<void> {
    try {
      // 1. Load and validate environment variables
      const env = loadEnv();

      // 2. Create configurations
      const appConfig = createAppConfig(env);
      const telegramConfig = createTelegramConfig(env);
      const ebayConfig = createEbayConfig(env);
      const paymentConfig = createPaymentConfig(env);

      // 3. Create logger
      this.logger = createLogger(env);
      this.logger.info('Application starting...');

      // 4. Initialize database
      this.dbConnection = new DatabaseConnection(appConfig.database.name, this.logger);
      await this.dbConnection.connect();
      await this.dbConnection.initialize();

      // 5. Create repositories
      const userRepository = new SqliteUserRepository(this.dbConnection, this.logger);
      const couponRepository = new SqliteCouponRepository(this.dbConnection, this.logger);

      // 6. Create infrastructure clients
      const browseApiClient = new EbayBrowseApiClient(ebayConfig, this.logger);
      const findingApiClient = new EbayFindingApiClient(ebayConfig, this.logger);
      const excelGenerator = new ExcelReportGenerator(this.logger);

      // 7. Create Telegram bot adapter
      this.botAdapter = new TelegramBotAdapter(telegramConfig, this.logger);

      // 8. Create services
      const trialBalance = Balance.create(appConfig.pricing.trialBalanceCents);
      const userService = new UserService(userRepository, trialBalance, this.logger);
      const couponService = new CouponService(couponRepository, this.logger);
      const ebaySearchService = new EbaySearchService(
        browseApiClient,
        findingApiClient,
        this.logger
      );

      // 9. Create use cases
      const costPerRequest = Balance.create(appConfig.pricing.costPerRequestCents);
      const processSearchUseCase = new ProcessSearchUseCase(
        userService,
        ebaySearchService,
        costPerRequest,
        this.logger
      );
      const redeemCouponUseCase = new RedeemCouponUseCase(userService, couponService, this.logger);
      const generateCouponUseCase = new GenerateCouponUseCase(couponService, this.logger);
      const updateSearchSettingsUseCase = new UpdateSearchSettingsUseCase(userService, this.logger);

      // 10. Create and register handlers
      const startCommandHandler = new StartCommandHandler(
        this.botAdapter,
        userService,
        this.logger
      );
      const messageHandler = new MessageHandler(
        this.botAdapter,
        userService,
        processSearchUseCase,
        redeemCouponUseCase,
        generateCouponUseCase,
        excelGenerator,
        this.logger
      );
      const callbackQueryHandler = new CallbackQueryHandler(
        this.botAdapter,
        userService,
        updateSearchSettingsUseCase,
        appConfig,
        paymentConfig,
        this.logger
      );

      startCommandHandler.register();
      messageHandler.register();
      callbackQueryHandler.register();

      // Register payment handlers if enabled
      if (paymentConfig.enabled) {
        const paymentHandler = new PaymentHandler(this.botAdapter, userService, this.logger);
        paymentHandler.register();
        this.logger.info('Payment handlers registered');
      }

      // 11. Start bot polling
      await this.botAdapter.startPolling();

      this.logger.info('✅ Application started successfully');

      // 12. Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`${signal} received, shutting down gracefully...`);

      try {
        // Stop bot polling
        if (this.botAdapter) {
          await this.botAdapter.stopPolling();
        }

        // Close database connection
        if (this.dbConnection) {
          await this.dbConnection.close();
        }

        this.logger.info('Application shut down successfully');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown', error as Error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection', reason as Error, { promise });
      process.exit(1);
    });
  }
}

/**
 * Entry point
 */
const app = new Application();
app.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
