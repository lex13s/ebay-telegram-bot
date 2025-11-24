"use strict";
/**
 * Tests for TelegramBotAdapter
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const TelegramBotAdapter_1 = require("../../../src/infrastructure/telegram/TelegramBotAdapter");
jest.mock('node-telegram-bot-api');
describe('Infrastructure Layer - Telegram: TelegramBotAdapter', () => {
    let adapter;
    let mockBot;
    let mockLogger;
    let config;
    beforeEach(() => {
        mockBot = {
            startPolling: jest.fn().mockResolvedValue(undefined),
            stopPolling: jest.fn().mockResolvedValue(undefined),
        };
        node_telegram_bot_api_1.default.mockImplementation(() => mockBot);
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
        config = {
            token: 'test_bot_token',
            adminId: 123456,
        };
        adapter = new TelegramBotAdapter_1.TelegramBotAdapter(config, mockLogger);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('initialization', () => {
        it('should create bot with polling disabled', () => {
            expect(node_telegram_bot_api_1.default).toHaveBeenCalledWith('test_bot_token', { polling: false });
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
