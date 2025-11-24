/**
 * Тесты для StartCommandHandler
 */

import TelegramBot from 'node-telegram-bot-api';
import { StartCommandHandler } from '../../../src/presentation/handlers/StartCommandHandler';
import { UserService } from '../../../src/application/services/UserService';
import { TelegramBotAdapter } from '../../../src/infrastructure/telegram/TelegramBotAdapter';
import { KeyboardBuilder } from '../../../src/presentation/keyboards/KeyboardBuilder';
import { MessageTemplates } from '../../../src/presentation/messages/MessageTemplates';
import { ILogger } from '../../../src/infrastructure/logging/Logger';
import { MockFactory } from '../../helpers';

// Mock modules
jest.mock('../../../src/presentation/keyboards/KeyboardBuilder');
jest.mock('../../../src/presentation/messages/MessageTemplates');

describe('Presentation Layer - Handler: StartCommandHandler', () => {
  let handler: StartCommandHandler;
  let mockBotAdapter: jest.Mocked<TelegramBotAdapter>;
  let mockUserService: jest.Mocked<UserService>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockBot: jest.Mocked<TelegramBot>;
  let onTextCallback: (msg: TelegramBot.Message) => Promise<void>;

  beforeEach(() => {
    // Setup mock bot
    mockBot = {
      sendMessage: jest.fn().mockResolvedValue({}),
      onText: jest.fn((regex, callback) => {
        onTextCallback = callback;
      }),
    } as any;

    // Setup mock bot adapter
    mockBotAdapter = {
      getBot: jest.fn().mockReturnValue(mockBot),
      isAdmin: jest.fn().mockReturnValue(false),
      sendMessage: jest.fn(),
      sendDocument: jest.fn(),
      editMessageText: jest.fn(),
      answerCallbackQuery: jest.fn(),
    } as any;

    // Setup mock user service
    mockUserService = {
      getOrCreateUser: jest.fn(),
      getUser: jest.fn(),
      saveUser: jest.fn(),
      updateBalance: jest.fn(),
      updateSearchConfig: jest.fn(),
    } as any;

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    // Setup mock static methods
    (MessageTemplates.start as jest.Mock) = jest.fn().mockReturnValue('Welcome message');
    (MessageTemplates.mainMenu as jest.Mock) = jest.fn().mockReturnValue('Main menu message');
    (KeyboardBuilder.createRemoveKeyboard as jest.Mock) = jest
      .fn()
      .mockReturnValue({ remove_keyboard: true });
    (KeyboardBuilder.createMainMenu as jest.Mock) = jest
      .fn()
      .mockReturnValue({ inline_keyboard: [] });

    handler = new StartCommandHandler(mockBotAdapter, mockUserService, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register /start command handler', () => {
      // Act
      handler.register();

      // Assert
      expect(mockBot.onText).toHaveBeenCalledWith(/\/start/, expect.any(Function));
    });
  });

  describe('handle - new user', () => {
    it('should create new user and send welcome messages', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'John',
          username: 'johndoe',
        },
      };

      const user = MockFactory.createUser({
        id: 123456,
        username: 'johndoe',
        balanceCents: 1000, // $10 trial
      });

      mockUserService.getOrCreateUser.mockResolvedValue(user);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({ value: 123456 }),
        'johndoe'
      );
      expect(mockBotAdapter.isAdmin).toHaveBeenCalledWith(123456);
      expect(MessageTemplates.start).toHaveBeenCalledWith('John');
      expect(MessageTemplates.mainMenu).toHaveBeenCalledWith('10.00');
      expect(mockBot.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Start command handled', { userId: 123456 });
    });

    it('should handle user without username', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 999999,
          is_bot: false,
          first_name: 'Anonymous',
        },
      };

      const user = MockFactory.createUser({
        id: 999999,
        username: null,
        balanceCents: 1000,
      });

      mockUserService.getOrCreateUser.mockResolvedValue(user);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({ value: 999999 }),
        null
      );
      expect(MessageTemplates.start).toHaveBeenCalledWith('Anonymous');
    });
  });

  describe('handle - existing user', () => {
    it('should get existing user and display their balance', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Jane',
          username: 'janedoe',
        },
      };

      const user = MockFactory.createUser({
        id: 123456,
        username: 'janedoe',
        balanceCents: 25000, // $250
      });

      mockUserService.getOrCreateUser.mockResolvedValue(user);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(MessageTemplates.mainMenu).toHaveBeenCalledWith('250.00');
    });

    it('should handle user with zero balance', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Broke',
        },
      };

      const user = MockFactory.createUser({
        id: 123456,
        balanceCents: 0,
      });

      mockUserService.getOrCreateUser.mockResolvedValue(user);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(MessageTemplates.mainMenu).toHaveBeenCalledWith('0.00');
    });
  });

  describe('handle - admin user', () => {
    it('should display admin menu for admin user', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 999,
          is_bot: false,
          first_name: 'Admin',
          username: 'admin',
        },
      };

      const user = MockFactory.createUser({
        id: 999,
        username: 'admin',
        balanceCents: 5000,
      });

      mockUserService.getOrCreateUser.mockResolvedValue(user);
      mockBotAdapter.isAdmin.mockReturnValue(true);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(mockBotAdapter.isAdmin).toHaveBeenCalledWith(999);
      expect(KeyboardBuilder.createMainMenu).toHaveBeenCalledWith(true);
    });

    it('should display regular menu for non-admin user', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'User',
        },
      };

      const user = MockFactory.createUser({
        id: 123456,
        balanceCents: 5000,
      });

      mockUserService.getOrCreateUser.mockResolvedValue(user);
      mockBotAdapter.isAdmin.mockReturnValue(false);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(KeyboardBuilder.createMainMenu).toHaveBeenCalledWith(false);
    });
  });

  describe('handle - message sending', () => {
    it('should send two messages in correct order', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Test',
        },
      };

      const user = MockFactory.createUser({ id: 123456 });
      mockUserService.getOrCreateUser.mockResolvedValue(user);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledTimes(2);

      // First call - welcome message
      expect(mockBot.sendMessage).toHaveBeenNthCalledWith(1, 12345, 'Welcome message', {
        reply_markup: { remove_keyboard: true },
      });

      // Second call - main menu
      expect(mockBot.sendMessage).toHaveBeenNthCalledWith(2, 12345, 'Main menu message', {
        reply_markup: { inline_keyboard: [] },
      });
    });

    it('should use correct chat id', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 99999, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Test',
        },
      };

      const user = MockFactory.createUser({ id: 123456 });
      mockUserService.getOrCreateUser.mockResolvedValue(user);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        99999,
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('handle - error handling', () => {
    it('should handle error when user service fails', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Test',
        },
      };

      const error = new Error('Database connection failed');
      mockUserService.getOrCreateUser.mockRejectedValue(error);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to handle start command', error, {
        userId: 123456,
      });
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle error when message sending fails', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Test',
        },
      };

      const user = MockFactory.createUser({ id: 123456 });
      mockUserService.getOrCreateUser.mockResolvedValue(user);

      const error = new Error('Telegram API error');
      mockBot.sendMessage.mockRejectedValue(error);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to handle start command', error, {
        userId: 123456,
      });
    });

    it('should return early if message has no from field', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        // No 'from' field
      };

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(mockUserService.getOrCreateUser).not.toHaveBeenCalled();
      expect(mockBot.sendMessage).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('handle - keyboard building', () => {
    it('should create remove keyboard for welcome message', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Test',
        },
      };

      const user = MockFactory.createUser({ id: 123456 });
      mockUserService.getOrCreateUser.mockResolvedValue(user);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(KeyboardBuilder.createRemoveKeyboard).toHaveBeenCalled();
    });

    it('should create main menu keyboard with admin flag', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 999,
          is_bot: false,
          first_name: 'Admin',
        },
      };

      const user = MockFactory.createUser({ id: 999 });
      mockUserService.getOrCreateUser.mockResolvedValue(user);
      mockBotAdapter.isAdmin.mockReturnValue(true);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(KeyboardBuilder.createMainMenu).toHaveBeenCalledWith(true);
    });
  });

  describe('handle - logging', () => {
    it('should log successful command handling', async () => {
      // Arrange
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: {
          id: 123456,
          is_bot: false,
          first_name: 'Test',
        },
      };

      const user = MockFactory.createUser({ id: 123456 });
      mockUserService.getOrCreateUser.mockResolvedValue(user);

      handler.register();

      // Act
      await onTextCallback(msg);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Start command handled', { userId: 123456 });
    });
  });
});
