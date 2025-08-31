
import TelegramBot from 'node-telegram-bot-api';
import { initializeBot } from '../src/bot';
import { findItem } from '../src/ebay';
import { createExcelReport } from '../src/excel';


// Mock external dependencies
jest.mock('node-telegram-bot-api');
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
        noItemsFoundOrError: 'No items were found for your search query, or an error occurred. Please try again with different part numbers.'
    },
    PART_NUMBER_DELIMITER_REGEX: /[,;\n]+/ // Include the regex in the mock
}));

import { BOT_MESSAGES } from '../src/constants';

// Cast mocks for easier typing
const MockTelegramBot = TelegramBot as jest.MockedClass<typeof TelegramBot>;
const mockFindItem = findItem as jest.Mock;
const mockCreateExcelReport = createExcelReport as jest.Mock;
const mockBotMessages = BOT_MESSAGES as jest.Mocked<typeof BOT_MESSAGES>;

describe('Telegram Bot Message Handler', () => {
    let botInstance: TelegramBot;
    let sendMessageSpy: jest.Mock;
    let sendDocumentSpy: jest.Mock;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Mock the TelegramBot constructor and its methods
        sendMessageSpy = jest.fn();
        sendDocumentSpy = jest.fn();
        MockTelegramBot.mockImplementation(() => {
            return {
                on: jest.fn((event, handler) => {
                    // Simulate message event for testing
                    if (event === 'message') {
                        // We will call this handler manually in tests
                    }
                }),
                onText: jest.fn(),
                sendMessage: sendMessageSpy,
                sendDocument: sendDocumentSpy,
                // Mock other methods if needed
            } as unknown as TelegramBot; // Cast to TelegramBot to satisfy type checker
        });

        // Initialize the bot (this will set up the 'on' handlers)
        initializeBot();

        // Get the mock instance created by initializeBot
        botInstance = MockTelegramBot.mock.results[0].value;
    });

    // Helper to simulate a message from Telegram
    const simulateMessage = async (text: string) => {
        // Find the 'message' event handler and call it
        const messageHandler = (botInstance.on as jest.Mock).mock.calls.find(call => call[0] === 'message')[1];
        await messageHandler({ chat: { id: 123 }, text: text });
    };

    it('should send processing and searching messages', async () => {
        mockFindItem.mockResolvedValue({ title: 'Found', price: '10' });

        await simulateMessage('PN123');

        expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.processing);
        expect(sendMessageSpy).toHaveBeenCalledWith(123, (BOT_MESSAGES as any).searching(1));
    });

    it('should send searchComplete and Excel if all items are found', async () => {
        mockFindItem.mockResolvedValueOnce({ title: 'Item1', price: '10' });
        mockFindItem.mockResolvedValueOnce({ title: 'Item2', price: '20' });
        mockCreateExcelReport.mockResolvedValue('excel_buffer');

        await simulateMessage('PN1,PN2');

        expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.processing);
        expect(sendMessageSpy).toHaveBeenCalledWith(123, (BOT_MESSAGES as any).searching(2));
        expect(mockFindItem).toHaveBeenCalledWith('PN1');
        expect(mockFindItem).toHaveBeenCalledWith('PN2');
        expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.searchComplete);
        expect(mockCreateExcelReport).toHaveBeenCalledWith([
            { partNumber: 'PN1', title: 'Item1', price: '10', found: true },
            { partNumber: 'PN2', title: 'Item2', price: '20', found: true },
        ]);
        expect(sendDocumentSpy).toHaveBeenCalledWith(123, 'excel_buffer', {}, expect.any(Object));
    });

    it('should send noItemsFoundOrError if no items are found', async () => {
        mockFindItem.mockResolvedValue(null);

        await simulateMessage('PN1');

        expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.processing);
        expect(sendMessageSpy).toHaveBeenCalledWith(123, (BOT_MESSAGES as any).searching(1));
        expect(mockFindItem).toHaveBeenCalledWith('PN1');
        expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.noItemsFoundOrError);
        expect(mockCreateExcelReport).not.toHaveBeenCalled();
        expect(sendDocumentSpy).not.toHaveBeenCalled();
    });

    it('should send searchComplete and Excel with only found items for mixed results', async () => {
        mockFindItem.mockResolvedValueOnce({ title: 'FoundItem', price: '100' });
        mockFindItem.mockResolvedValueOnce(null);
        mockCreateExcelReport.mockResolvedValue('excel_buffer');

        await simulateMessage('PN1,PN2');

        expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.processing);
        expect(sendMessageSpy).toHaveBeenCalledWith(123, (BOT_MESSAGES as any).searching(2));
        expect(mockFindItem).toHaveBeenCalledWith('PN1');
        expect(mockFindItem).toHaveBeenCalledWith('PN2');
        expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.searchComplete);
        expect(mockCreateExcelReport).toHaveBeenCalledWith([
            { partNumber: 'PN1', title: 'FoundItem', price: '100', found: true },
        ]);
        expect(sendDocumentSpy).toHaveBeenCalledWith(123, 'excel_buffer', {}, expect.any(Object));
    });

    it('should send error message on general exception', async () => {
        mockFindItem.mockRejectedValue(new Error('API Error'));

        await simulateMessage('PN1');

        expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.processing);
        expect(sendMessageSpy).toHaveBeenCalledWith(123, (BOT_MESSAGES as any).searching(1));
        expect(mockFindItem).toHaveBeenCalledWith('PN1');
        expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.error);
        expect(mockCreateExcelReport).not.toHaveBeenCalled();
        expect(sendDocumentSpy).not.toHaveBeenCalled();
    });
});
