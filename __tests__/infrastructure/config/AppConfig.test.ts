import { createAppConfig, AppConfig } from '../../../src/infrastructure';
import { EnvConfig } from '../../../src/infrastructure';

describe('Infrastructure Layer - Config: AppConfig', () => {
  describe('createAppConfig - basic functionality', () => {
    it('should create app config from env config', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig).toBeDefined();
      expect(appConfig).toHaveProperty('database');
      expect(appConfig).toHaveProperty('payments');
      expect(appConfig).toHaveProperty('pricing');
    });

    it('should return correct structure', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(typeof appConfig.database.name).toBe('string');
      expect(typeof appConfig.payments.enabled).toBe('boolean');
      expect(typeof appConfig.payments.amountCents).toBe('number');
      expect(typeof appConfig.payments.currency).toBe('string');
      expect(typeof appConfig.pricing.trialBalanceCents).toBe('number');
      expect(typeof appConfig.pricing.costPerRequestCents).toBe('number');
    });
  });

  describe('database config', () => {
    it('should set database name to bot_database.sqlite', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig.database.name).toBe('bot_database.sqlite');
    });

    it('should use same database name for all environments', () => {
      const envs: Array<EnvConfig['NODE_ENV']> = ['development', 'production', 'test'];

      envs.forEach((nodeEnv) => {
        const envConfig: EnvConfig = {
          TELEGRAM_BOT_TOKEN: 'token',
          ADMIN_USER_ID: 123456,
          EBAY_CLIENT_ID: 'client_id',
          EBAY_CLIENT_SECRET: 'secret',
          NODE_ENV: nodeEnv,
        };

        const appConfig = createAppConfig(envConfig);
        expect(appConfig.database.name).toBe('bot_database.sqlite');
      });
    });
  });

  describe('payments config - enabled', () => {
    it('should enable payments when STRIPE_PROVIDER_TOKEN is provided', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        STRIPE_PROVIDER_TOKEN: 'stripe_token_123',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig.payments.enabled).toBe(true);
    });

    it('should disable payments when STRIPE_PROVIDER_TOKEN is missing', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig.payments.enabled).toBe(false);
    });

    it('should disable payments when STRIPE_PROVIDER_TOKEN is undefined', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        STRIPE_PROVIDER_TOKEN: undefined,
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig.payments.enabled).toBe(false);
    });
  });

  describe('payments config - amount and currency', () => {
    it('should set payment amount to $20.00 (2000 cents)', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig.payments.amountCents).toBe(2000);
    });

    it('should set currency to USD', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig.payments.currency).toBe('USD');
    });

    it('should have same payment settings regardless of stripe token', () => {
      const envWithStripe: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        STRIPE_PROVIDER_TOKEN: 'stripe_token',
        NODE_ENV: 'test',
      };

      const envWithoutStripe: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const configWith = createAppConfig(envWithStripe);
      const configWithout = createAppConfig(envWithoutStripe);

      expect(configWith.payments.amountCents).toBe(configWithout.payments.amountCents);
      expect(configWith.payments.currency).toBe(configWithout.payments.currency);
    });
  });

  describe('pricing config', () => {
    it('should set trial balance to $10.00 (1000 cents)', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig.pricing.trialBalanceCents).toBe(1000);
    });

    it('should set cost per request to $0.10 (10 cents)', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig.pricing.costPerRequestCents).toBe(10);
    });

    it('should have consistent pricing across environments', () => {
      const envs: Array<EnvConfig['NODE_ENV']> = ['development', 'production', 'test'];

      envs.forEach((nodeEnv) => {
        const envConfig: EnvConfig = {
          TELEGRAM_BOT_TOKEN: 'token',
          ADMIN_USER_ID: 123456,
          EBAY_CLIENT_ID: 'client_id',
          EBAY_CLIENT_SECRET: 'secret',
          NODE_ENV: nodeEnv,
        };

        const appConfig = createAppConfig(envConfig);
        expect(appConfig.pricing.trialBalanceCents).toBe(1000);
        expect(appConfig.pricing.costPerRequestCents).toBe(10);
      });
    });
  });

  describe('config immutability', () => {
    it('should create new config for each call', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const config1 = createAppConfig(envConfig);
      const config2 = createAppConfig(envConfig);

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('config values consistency', () => {
    it('should match expected dollar amounts', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      // Trial balance: $10.00
      expect(appConfig.pricing.trialBalanceCents / 100).toBe(10);

      // Cost per request: $0.10
      expect(appConfig.pricing.costPerRequestCents / 100).toBe(0.1);

      // Payment amount: $20.00
      expect(appConfig.payments.amountCents / 100).toBe(20);
    });

    it('should have positive pricing values', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig = createAppConfig(envConfig);

      expect(appConfig.pricing.trialBalanceCents).toBeGreaterThan(0);
      expect(appConfig.pricing.costPerRequestCents).toBeGreaterThan(0);
      expect(appConfig.payments.amountCents).toBeGreaterThan(0);
    });
  });

  describe('type safety', () => {
    it('should return correctly typed AppConfig', () => {
      const envConfig: EnvConfig = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 123456,
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const appConfig: AppConfig = createAppConfig(envConfig);

      expect(appConfig.database).toBeDefined();
      expect(appConfig.payments).toBeDefined();
      expect(appConfig.pricing).toBeDefined();
    });
  });
});
