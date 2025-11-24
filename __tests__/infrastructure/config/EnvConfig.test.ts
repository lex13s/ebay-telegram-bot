/**
 * Tests for EnvConfig
 */

import { loadEnv, EnvConfig } from '../../../src/infrastructure';

describe('Infrastructure Layer - Config: EnvConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadEnv - success cases', () => {
    it('should load valid environment configuration', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'test_bot_token_123',
        ADMIN_USER_ID: '123456789',
        EBAY_CLIENT_ID: 'ebay_client_id',
        EBAY_CLIENT_SECRET: 'ebay_client_secret',
        NODE_ENV: 'test',
      };

      const config = loadEnv();

      expect(config.TELEGRAM_BOT_TOKEN).toBe('test_bot_token_123');
      expect(config.ADMIN_USER_ID).toBe(123456789);
      expect(config.EBAY_CLIENT_ID).toBe('ebay_client_id');
      expect(config.EBAY_CLIENT_SECRET).toBe('ebay_client_secret');
      expect(config.NODE_ENV).toBe('test');
    });

    it('should default NODE_ENV to production', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      const config = loadEnv();

      expect(config.NODE_ENV).toBe('production');
    });

    it('should handle optional STRIPE_PROVIDER_TOKEN', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      const config = loadEnv();

      expect(config.STRIPE_PROVIDER_TOKEN).toBeUndefined();
    });

    it('should include STRIPE_PROVIDER_TOKEN if provided', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        STRIPE_PROVIDER_TOKEN: 'stripe_token_123',
      };

      const config = loadEnv();

      expect(config.STRIPE_PROVIDER_TOKEN).toBe('stripe_token_123');
    });

    it('should accept development environment', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'development',
      };

      const config = loadEnv();

      expect(config.NODE_ENV).toBe('development');
    });

    it('should accept production environment', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'production',
      };

      const config = loadEnv();

      expect(config.NODE_ENV).toBe('production');
    });
  });

  describe('loadEnv - validation errors', () => {
    it('should throw error when TELEGRAM_BOT_TOKEN is missing', () => {
      process.env = {
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when TELEGRAM_BOT_TOKEN is empty', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: '',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when ADMIN_USER_ID is missing', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when ADMIN_USER_ID is not numeric', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: 'not_a_number',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when EBAY_CLIENT_ID is missing', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_SECRET: 'secret',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when EBAY_CLIENT_SECRET is missing', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });

    it('should throw error when NODE_ENV is invalid', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'invalid_env',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });
  });

  describe('ADMIN_USER_ID transformation', () => {
    it('should transform string to number', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '999888777',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      const config = loadEnv();

      expect(typeof config.ADMIN_USER_ID).toBe('number');
      expect(config.ADMIN_USER_ID).toBe(999888777);
    });

    it('should handle large user IDs', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '1234567890123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      const config = loadEnv();

      expect(config.ADMIN_USER_ID).toBe(1234567890123);
    });
  });

  describe('type safety', () => {
    it('should return correctly typed EnvConfig', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
        NODE_ENV: 'test',
      };

      const config: EnvConfig = loadEnv();

      // Type assertions
      expect(typeof config.TELEGRAM_BOT_TOKEN).toBe('string');
      expect(typeof config.ADMIN_USER_ID).toBe('number');
      expect(typeof config.EBAY_CLIENT_ID).toBe('string');
      expect(typeof config.EBAY_CLIENT_SECRET).toBe('string');
      expect(['development', 'production', 'test']).toContain(config.NODE_ENV);
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace in token', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: '  token  ',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      const config = loadEnv();

      expect(config.TELEGRAM_BOT_TOKEN).toBe('  token  ');
    });

    it('should reject ADMIN_USER_ID with decimals', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123.456',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });

    it('should reject negative ADMIN_USER_ID', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '-123',
        EBAY_CLIENT_ID: 'client_id',
        EBAY_CLIENT_SECRET: 'secret',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });

    it('should handle empty EBAY credentials', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'token',
        ADMIN_USER_ID: '123',
        EBAY_CLIENT_ID: '',
        EBAY_CLIENT_SECRET: '',
      };

      expect(() => loadEnv()).toThrow('Environment validation failed');
    });
  });

  describe('all required fields', () => {
    it('should validate all required fields are present', () => {
      process.env = {
        TELEGRAM_BOT_TOKEN: 'bot_token_here',
        ADMIN_USER_ID: '987654321',
        EBAY_CLIENT_ID: 'ebay_client_12345',
        EBAY_CLIENT_SECRET: 'ebay_secret_67890',
        NODE_ENV: 'development',
        STRIPE_PROVIDER_TOKEN: 'stripe_token',
      };

      const config = loadEnv();

      expect(config).toHaveProperty('TELEGRAM_BOT_TOKEN');
      expect(config).toHaveProperty('ADMIN_USER_ID');
      expect(config).toHaveProperty('EBAY_CLIENT_ID');
      expect(config).toHaveProperty('EBAY_CLIENT_SECRET');
      expect(config).toHaveProperty('NODE_ENV');
      expect(config).toHaveProperty('STRIPE_PROVIDER_TOKEN');
    });
  });
});
