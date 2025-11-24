"use strict";
/**
 * Тесты для MessageHandler (основные сценарии)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const MessageHandler_1 = require("../../../src/presentation/handlers/MessageHandler");
const helpers_1 = require("../../helpers");
const DomainErrors_1 = require("../../../src/domain/errors/DomainErrors");
const domain_1 = require("../../../src/domain");
const KeyboardBuilderModule = __importStar(require("../../../src/presentation/keyboards/KeyboardBuilder"));
const MessageTemplatesModule = __importStar(require("../../../src/presentation/messages/MessageTemplates"));
// Mock static modules
jest.mock('../../../src/presentation/keyboards/KeyboardBuilder');
jest.mock('../../../src/presentation/messages/MessageTemplates');
const KeyboardBuilder = KeyboardBuilderModule.KeyboardBuilder;
const MessageTemplates = MessageTemplatesModule.MessageTemplates;
describe.skip('Presentation Layer - Handler: MessageHandler', () => {
    let handler;
    let mockBotAdapter;
    let mockUserService;
    let mockProcessSearchUseCase;
    let mockRedeemCouponUseCase;
    let mockGenerateCouponUseCase;
    let mockExcelGenerator;
    let mockLogger;
    let mockBot;
    let onMessageCallback;
    beforeEach(() => {
        mockBot = {
            sendMessage: jest.fn().mockResolvedValue({}),
            sendDocument: jest.fn().mockResolvedValue({}),
            deleteMessage: jest.fn().mockResolvedValue(true),
            on: jest.fn((event, callback) => {
                if (event === 'message')
                    onMessageCallback = callback;
            }),
        };
        mockBotAdapter = {
            getBot: jest.fn().mockReturnValue(mockBot),
            isAdmin: jest.fn().mockReturnValue(false),
        };
        mockUserService = {
            getOrCreateUser: jest.fn(),
            getUser: jest.fn(),
        };
        mockProcessSearchUseCase = {
            execute: jest.fn(),
        };
        mockRedeemCouponUseCase = {
            execute: jest.fn(),
        };
        mockGenerateCouponUseCase = {
            execute: jest.fn(),
        };
        mockExcelGenerator = {
            generate: jest.fn(),
        };
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
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
        handler = new MessageHandler_1.MessageHandler(mockBotAdapter, mockUserService, mockProcessSearchUseCase, mockRedeemCouponUseCase, mockGenerateCouponUseCase, mockExcelGenerator, mockLogger);
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
            const msg = {
                message_id: 1,
                date: Date.now(),
                chat: { id: 12345, type: 'private' },
                from: { id: 123456, is_bot: false, first_name: 'User' },
                text: 'PART-001\nPART-002',
            };
            const searchResults = [
                helpers_1.MockFactory.createSearchResult({ partNumber: 'PART-001' }),
                helpers_1.MockFactory.createSearchResult({ partNumber: 'PART-002' }),
            ];
            const user = helpers_1.MockFactory.createUser({ id: 123456, balanceCents: 8000 });
            mockProcessSearchUseCase.execute.mockResolvedValue({
                results: searchResults,
                cost: domain_1.Balance.fromDollars(2),
                newBalance: domain_1.Balance.fromDollars(80),
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
            const msg = {
                message_id: 1,
                date: Date.now(),
                chat: { id: 12345, type: 'private' },
                from: { id: 123456, is_bot: false, first_name: 'User' },
                text: 'NOT-FOUND',
            };
            const user = helpers_1.MockFactory.createUser({ id: 123456, balanceCents: 10000 });
            mockProcessSearchUseCase.execute.mockResolvedValue({
                results: [helpers_1.MockFactory.createSearchResultNotFound('NOT-FOUND')],
                cost: domain_1.Balance.fromDollars(2),
                newBalance: domain_1.Balance.fromDollars(100),
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
            const msg = {
                message_id: 1,
                date: Date.now(),
                chat: { id: 12345, type: 'private' },
                from: { id: 123456, is_bot: false, first_name: 'User' },
                text: 'PART-001',
            };
            mockProcessSearchUseCase.execute.mockRejectedValue(new DomainErrors_1.InsufficientFundsError(200, 100));
            handler.register();
            await onMessageCallback(msg);
            expect(MessageTemplates.insufficientFunds).toHaveBeenCalled();
            expect(KeyboardBuilder.createInsufficientFunds).toHaveBeenCalled();
            expect(mockBot.sendDocument).not.toHaveBeenCalled();
        });
    });
    describe('handleSearchRequest - validation', () => {
        it('should reject empty part numbers', async () => {
            const msg = {
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
            const msg = {
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
            const msg = {
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
            const msg = {
                message_id: 1,
                date: Date.now(),
                chat: { id: 12345, type: 'private' },
                from: { id: 999, is_bot: false, first_name: 'Admin' },
                text: 'ADMIN-PART',
            };
            const searchResults = [helpers_1.MockFactory.createSearchResult({ partNumber: 'ADMIN-PART' })];
            const user = helpers_1.MockFactory.createUser({ id: 999, balanceCents: 5000 });
            mockBotAdapter.isAdmin.mockReturnValue(true);
            mockProcessSearchUseCase.execute.mockResolvedValue({
                results: searchResults,
                cost: domain_1.Balance.create(0),
                newBalance: domain_1.Balance.fromDollars(50),
                refunded: false,
            });
            mockUserService.getUser.mockResolvedValue(user);
            mockExcelGenerator.generate.mockResolvedValue(Buffer.from('excel'));
            handler.register();
            await onMessageCallback(msg);
            expect(mockProcessSearchUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: true }));
            expect(MessageTemplates.requestCompleteFree).toHaveBeenCalled();
        });
    });
    describe('error handling', () => {
        it('should handle general errors', async () => {
            const msg = {
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
            const msg = {
                message_id: 1,
                date: Date.now(),
                chat: { id: 12345, type: 'private' },
                from: { id: 123456, is_bot: false, first_name: 'User' },
                text: 'PART-001',
            };
            const searchResults = [helpers_1.MockFactory.createSearchResult({ partNumber: 'PART-001' })];
            const user = helpers_1.MockFactory.createUser({ id: 123456, balanceCents: 8000 });
            mockProcessSearchUseCase.execute.mockResolvedValue({
                results: searchResults,
                cost: domain_1.Balance.fromDollars(2),
                newBalance: domain_1.Balance.fromDollars(80),
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
