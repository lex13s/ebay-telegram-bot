// Set environment variables for testing to prevent process.exit calls
process.env.APP_URL = 'https://test-app.com';

import TelegramBot from 'node-telegram-bot-api';
import { findItem } from '../src/ebay';
import { createExcelReport } from '../src/excel';

// Mock external dependencies
jest.mock('node-telegram-bot-api', () => {
  // This factory function returns a mock constructor
  return jest.fn().mockImplementation(() => {
    // The mock constructor returns a mock bot instance
    return {
      on: jest.fn(),
      onText: jest.fn(),
      sendMessage: jest.fn(),
      sendDocument: jest.fn(),
      setWebHook: jest.fn(() => Promise.resolve(true)), // IMPORTANT: Returns a promise
    };
  });
});
jest.mock('../src/ebay');
jest.mock('../src/excel');
jest.mock('../src/constants', () => ({
  BOT_MESSAGES: {
    start: 'Hello! Send me a part number to search on eBay.',
    processing: 'Processing your request...', 
    searching: (count: number) => `Searching for ${count} part number(s) on eBay...`,
    searchComplete: 'Search complete! Generating Excel report...', 
    noPartNumbers: 'Please provide at least one part number.',
    error: 'An unexpected error occurred. Please try again later.',
    noItemsFoundOrError:
      'No items were found for your search query, or an error occurred. Please try again with different part numbers.',
  },
  PART_NUMBER_DELIMITER_REGEX: /[,;\n]+/, 
}));

// Import the bot instance AFTER mocks are set up
import { bot } from '../src/bot';
import { BOT_MESSAGES } from '../src/constants';

// Cast mocks for easier typing
const MockedBot = bot as jest.Mocked<TelegramBot>;
const mockFindItem = findItem as jest.Mock;
const mockCreateExcelReport = createExcelReport as jest.Mock;

describe('Telegram Bot Message Handler', () => {
  let messageHandler: (msg: TelegramBot.Message) => Promise<void>;

  beforeAll(() => {
    // Find the 'message' handler that was registered when bot.ts was imported
    const messageCallback = (MockedBot.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'message'
    );
    if (!messageCallback) {
      throw new Error("'message' handler not registered on bot instance")
    }
    messageHandler = messageCallback[1];
  });

  beforeEach(() => {
    // Clear mock function calls before each test
    jest.clearAllMocks();
  });

  // Helper to simulate a message from Telegram
  const simulateMessage = async (text: string) => {
    const message: TelegramBot.Message = {
      message_id: 1,
      date: Date.now() / 1000,
      chat: { id: 123, type: 'private' },
      text: text,
    };
    await messageHandler(message);
  };

  it('should send processing and searching messages', async () => {
    mockFindItem.mockResolvedValue({ title: 'Found', price: '10', found: true });

    await simulateMessage('PN123');

    expect(MockedBot.sendMessage).toHaveBeenCalledWith(123, BOT_MESSAGES.processing);
    expect(MockedBot.sendMessage).toHaveBeenCalledWith(123, (BOT_MESSAGES as any).searching(1));
  });

  it('should send searchComplete and Excel if all items are found', async () => {
    mockFindItem.mockResolvedValueOnce({ title: 'Item1', price: '10', found: true });
    mockFindItem.mockResolvedValueOnce({ title: 'Item2', price: '20', found: true });
    mockCreateExcelReport.mockResolvedValue(Buffer.from('excel_buffer'));

    await simulateMessage('PN1,PN2');

    expect(MockedBot.sendMessage).toHaveBeenCalledWith(123, BOT_MESSAGES.searchComplete);
    expect(mockCreateExcelReport).toHaveBeenCalledWith([
      { partNumber: 'PN1', title: 'Item1', price: '10', found: true },
      { partNumber: 'PN2', title: 'Item2', price: '20', found: true },
    ]);
    expect(MockedBot.sendDocument).toHaveBeenCalledWith(123, expect.any(Buffer), {}, expect.any(Object));
  });

  it('should send noItemsFoundOrError if no items are found', async () => {
    mockFindItem.mockResolvedValue(null);

    await simulateMessage('PN1');

    expect(MockedBot.sendMessage).toHaveBeenCalledWith(123, BOT_MESSAGES.noItemsFoundOrError);
    expect(mockCreateExcelReport).not.toHaveBeenCalled();
    expect(MockedBot.sendDocument).not.toHaveBeenCalled();
  });
});