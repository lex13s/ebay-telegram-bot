/**
 * Тесты для MessageHandler (основные сценарии)
 */

import TelegramBot from 'node-telegram-bot-api';
import { MessageHandler } from '../../../src/presentation/handlers/MessageHandler';
import {
  UserService,
  ProcessSearchUseCase,
  RedeemCouponUseCase,
  GenerateCouponUseCase,
} from '../../../src/application';
import { TelegramBotAdapter, ExcelReportGenerator, ILogger } from '../../../src/infrastructure';
import { MockFactory } from '../../helpers';
import { InsufficientFundsError } from '../../../src/domain/errors/DomainErrors';
import { Balance } from '../../../src/domain';

import * as KeyboardBuilderModule from '../../../src/presentation/keyboards/KeyboardBuilder';
import * as MessageTemplatesModule from '../../../src/presentation/messages/MessageTemplates';

// Mock static modules
jest.mock('../../../src/presentation/keyboards/KeyboardBuilder');
jest.mock('../../../src/presentation/messages/MessageTemplates');

const KeyboardBuilder = KeyboardBuilderModule.KeyboardBuilder;
const MessageTemplates = MessageTemplatesModule.MessageTemplates;

describe.skip('Presentation Layer - Handler: MessageHandler', () => {
  let handler: MessageHandler;
  let mockBotAdapter: jest.Mocked<TelegramBotAdapter>;
  let mockUserService: jest.Mocked<UserService>;
  let mockProcessSearchUseCase: jest.Mocked<ProcessSearchUseCase>;
  let mockRedeemCouponUseCase: jest.Mocked<RedeemCouponUseCase>;
  let mockGenerateCouponUseCase: jest.Mocked<GenerateCouponUseCase>;
  let mockExcelGenerator: jest.Mocked<ExcelReportGenerator>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockBot: jest.Mocked<TelegramBot>;
  let onMessageCallback: (msg: TelegramBot.Message) => Promise<void>;

  beforeEach(() => {
    mockBot = {
      sendMessage: jest.fn().mockResolvedValue({}),
      sendDocument: jest.fn().mockResolvedValue({}),
      deleteMessage: jest.fn().mockResolvedValue(true),
      on: jest.fn((event, callback) => {
        if (event === 'message') onMessageCallback = callback;
      }),
    } as any;

    mockBotAdapter = {
      getBot: jest.fn().mockReturnValue(mockBot),
      isAdmin: jest.fn().mockReturnValue(false),
    } as any;

    mockUserService = {
      getOrCreateUser: jest.fn(),
      getUser: jest.fn(),
    } as any;

    mockProcessSearchUseCase = {
      execute: jest.fn(),
    } as any;

    mockRedeemCouponUseCase = {
      execute: jest.fn(),
    } as any;

    mockGenerateCouponUseCase = {
      execute: jest.fn(),
    } as any;

    mockExcelGenerator = {
      generate: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    // Setup mocks
    MessageTemplates.processing = jest.fn().mockReturnValue('Processing...');
    MessageTemplates.searching = jest.fn().mockReturnValue('Searching...');
    MessageTemplates.searchComplete = jest.fn().mockReturnValue('Complete!');
    MessageTemplates.noPartNumbers = jest.fn().mockReturnValue('No part numbers');
    MessageTemplates.requestComplete = jest.fn().mockReturnValue('Request complete');
    MessageTemplates.requestCompleteFree = jest.fn().mockReturnValue('Request complete (free)');
    MessageTemplates.noItemsFound = jest.fn().mockReturnValue('No items found');
    MessageTemplates.noItemsFoundAndRefund = jest.fn().mockReturnValue('No items, refunded');
    MessageTemplates.mainMenu = jest.fn().mockReturnValue('Main menu');
    MessageTemplates.insufficientFunds = jest.fn().mockReturnValue('Insufficient funds');
    MessageTemplates.error = jest.fn().mockReturnValue('Error');
    MessageTemplates.enterCouponCode = jest.fn().mockReturnValue('Enter coupon code:');
    MessageTemplates.enterCouponValue = jest.fn().mockReturnValue('Enter coupon value:');

    KeyboardBuilder.createMainMenu = jest.fn().mockReturnValue({ inline_keyboard: [] });
    KeyboardBuilder.createInsufficientFunds = jest.fn().mockReturnValue({ inline_keyboard: [] });
    KeyboardBuilder.createRemoveKeyboard = jest.fn().mockReturnValue({ remove_keyboard: true });

    handler = new MessageHandler(
      mockBotAdapter,
      mockUserService,
      mockProcessSearchUseCase,
      mockRedeemCouponUseCase,
      mockGenerateCouponUseCase,
      mockExcelGenerator,
      mockLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register message handler', () => {
      handler.register();
      expect(mockBot.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('handleSearchRequest - successful search', () => {
    it('should process search and send Excel report', async () => {
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: { id: 123456, is_bot: false, first_name: 'User' },
        text: 'PART-001\nPART-002',
      };

      const searchResults = [
        MockFactory.createSearchResult({ partNumber: 'PART-001' }),
        MockFactory.createSearchResult({ partNumber: 'PART-002' }),
      ];

      const user = MockFactory.createUser({ id: 123456, balanceCents: 8000 });

      mockProcessSearchUseCase.execute.mockResolvedValue({
        results: searchResults,
        cost: Balance.fromDollars(2),
        newBalance: Balance.fromDollars(80),
        refunded: false,
      });

      mockUserService.getUser.mockResolvedValue(user);
      mockExcelGenerator.generate.mockResolvedValue(Buffer.from('excel data'));

      handler.register();
      await onMessageCallback(msg);

      expect(mockProcessSearchUseCase.execute).toHaveBeenCalled();
      expect(mockExcelGenerator.generate).toHaveBeenCalledWith(searchResults);
      expect(mockBot.sendDocument).toHaveBeenCalled();
      expect(mockBot.sendMessage).toHaveBeenCalledWith(12345, expect.any(String));
    });
  });

  describe('handleSearchRequest - no results with refund', () => {
    it('should handle no results and refund user', async () => {
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: { id: 123456, is_bot: false, first_name: 'User' },
        text: 'NOT-FOUND',
      };

      const user = MockFactory.createUser({ id: 123456, balanceCents: 10000 });

      mockProcessSearchUseCase.execute.mockResolvedValue({
        results: [MockFactory.createSearchResultNotFound('NOT-FOUND')],
        cost: Balance.fromDollars(2),
        newBalance: Balance.fromDollars(100),
        refunded: true,
      });

      mockUserService.getUser.mockResolvedValue(user);

      handler.register();
      await onMessageCallback(msg);

      expect(MessageTemplates.noItemsFoundAndRefund).toHaveBeenCalled();
      expect(mockExcelGenerator.generate).not.toHaveBeenCalled();
      expect(mockBot.sendDocument).not.toHaveBeenCalled();
    });
  });

  describe('handleSearchRequest - insufficient funds', () => {
    it('should show insufficient funds message', async () => {
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: { id: 123456, is_bot: false, first_name: 'User' },
        text: 'PART-001',
      };

      mockProcessSearchUseCase.execute.mockRejectedValue(new InsufficientFundsError(200, 100));

      handler.register();
      await onMessageCallback(msg);

      expect(MessageTemplates.insufficientFunds).toHaveBeenCalled();
      expect(KeyboardBuilder.createInsufficientFunds).toHaveBeenCalled();
      expect(mockBot.sendDocument).not.toHaveBeenCalled();
    });
  });

  describe('handleSearchRequest - validation', () => {
    it('should reject empty part numbers', async () => {
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: { id: 123456, is_bot: false, first_name: 'User' },
        text: '   ',
      };

      handler.register();
      await onMessageCallback(msg);

      expect(MessageTemplates.noPartNumbers).toHaveBeenCalled();
      expect(mockProcessSearchUseCase.execute).not.toHaveBeenCalled();
    });

    it('should skip commands', async () => {
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: { id: 123456, is_bot: false, first_name: 'User' },
        text: '/start',
      };

      handler.register();
      await onMessageCallback(msg);

      expect(mockProcessSearchUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return early if no from field', async () => {
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        text: 'PART-001',
      };

      handler.register();
      await onMessageCallback(msg);

      expect(mockProcessSearchUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('handleSearchRequest - admin user', () => {
    it('should process free search for admin', async () => {
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: { id: 999, is_bot: false, first_name: 'Admin' },
        text: 'ADMIN-PART',
      };

      const searchResults = [MockFactory.createSearchResult({ partNumber: 'ADMIN-PART' })];
      const user = MockFactory.createUser({ id: 999, balanceCents: 5000 });

      mockBotAdapter.isAdmin.mockReturnValue(true);
      mockProcessSearchUseCase.execute.mockResolvedValue({
        results: searchResults,
        cost: Balance.create(0),
        newBalance: Balance.fromDollars(50),
        refunded: false,
      });

      mockUserService.getUser.mockResolvedValue(user);
      mockExcelGenerator.generate.mockResolvedValue(Buffer.from('excel'));

      handler.register();
      await onMessageCallback(msg);

      expect(mockProcessSearchUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ isAdmin: true })
      );
      expect(MessageTemplates.requestCompleteFree).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle general errors', async () => {
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: { id: 123456, is_bot: false, first_name: 'User' },
        text: 'PART-001',
      };

      const error = new Error('Unexpected error');
      mockProcessSearchUseCase.execute.mockRejectedValue(error);

      handler.register();
      await onMessageCallback(msg);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to handle message', error, {
        userId: 123456,
      });
      expect(MessageTemplates.error).toHaveBeenCalled();
    });
  });

  describe('message sequencing', () => {
    it('should send messages in correct order', async () => {
      const msg: TelegramBot.Message = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 12345, type: 'private' },
        from: { id: 123456, is_bot: false, first_name: 'User' },
        text: 'PART-001',
      };

      const searchResults = [MockFactory.createSearchResult({ partNumber: 'PART-001' })];
      const user = MockFactory.createUser({ id: 123456, balanceCents: 8000 });

      mockProcessSearchUseCase.execute.mockResolvedValue({
        results: searchResults,
        cost: Balance.fromDollars(2),
        newBalance: Balance.fromDollars(80),
        refunded: false,
      });

      mockUserService.getUser.mockResolvedValue(user);
      mockExcelGenerator.generate.mockResolvedValue(Buffer.from('excel'));

      handler.register();
      await onMessageCallback(msg);

      const calls = mockBot.sendMessage.mock.calls.map((call) => call[1]);
      expect(calls[0]).toBe('Processing...');
      expect(calls[1]).toBe('Searching...');
      expect(calls[2]).toBe('Complete!');
    });
  });
});
