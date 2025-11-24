/**
 * Tests for TelegramBotAdapter
 */

import TelegramBot from 'node-telegram-bot-api';
import { TelegramBotAdapter } from '../../../src/infrastructure/telegram/TelegramBotAdapter';
import { TelegramConfig } from '../../../src/infrastructure/config/TelegramConfig';
import { ILogger } from '../../../src/infrastructure/logging/Logger';

jest.mock('node-telegram-bot-api');

describe('Infrastructure Layer - Telegram: TelegramBotAdapter', () => {
  let adapter: TelegramBotAdapter;
  let mockBot: jest.Mocked<TelegramBot>;
  let mockLogger: jest.Mocked<ILogger>;
  let config: TelegramConfig;

  beforeEach(() => {
    mockBot = {
      startPolling: jest.fn().mockResolvedValue(undefined),
      stopPolling: jest.fn().mockResolvedValue(undefined),
    } as any;

    (TelegramBot as jest.MockedClass<typeof TelegramBot>).mockImplementation(() => mockBot);

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    config = {
      token: 'test_bot_token',
      adminId: 123456,
    };

    adapter = new TelegramBotAdapter(config, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create bot with polling disabled', () => {
      expect(TelegramBot).toHaveBeenCalledWith('test_bot_token', { polling: false });
      expect(mockLogger.info).toHaveBeenCalledWith('Telegram bot adapter initialized');
    });
  });

  describe('getBot', () => {
    it('should return bot instance', () => {
      const bot = adapter.getBot();
      expect(bot).toBe(mockBot);
    });
  });

  describe('startPolling', () => {
    it('should start polling successfully', async () => {
      await adapter.startPolling();

      expect(mockBot.startPolling).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Telegram bot polling started');
    });

    it('should handle errors', async () => {
      const error = new Error('Polling failed');
      mockBot.startPolling.mockRejectedValue(error);

      await expect(adapter.startPolling()).rejects.toThrow('Polling failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to start Telegram bot polling', error);
    });
  });

  describe('stopPolling', () => {
    it('should stop polling successfully', async () => {
      await adapter.stopPolling();

      expect(mockBot.stopPolling).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Telegram bot polling stopped');
    });

    it('should handle errors without throwing', async () => {
      const error = new Error('Stop failed');
      mockBot.stopPolling.mockRejectedValue(error);

      await expect(adapter.stopPolling()).resolves.not.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      expect(adapter.isAdmin(123456)).toBe(true);
    });

    it('should return false for non-admin user', () => {
      expect(adapter.isAdmin(999999)).toBe(false);
    });
  });
});
