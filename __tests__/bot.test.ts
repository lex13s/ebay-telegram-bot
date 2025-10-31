import TelegramBot from 'node-telegram-bot-api'
import { initializeBot } from '../src/bot'
import { findItem } from '../src/ebay'
import { createExcelReport } from '../src/excel'
import {
  getOrCreateUser,
  updateUserBalance,
  getUser
} from '../src/database'
import { config } from '../src/config'
import { BOT_MESSAGES } from '../src/constants'

// Mock external dependencies
jest.mock('node-telegram-bot-api')
jest.mock('../src/ebay')
jest.mock('../src/excel')
jest.mock('../src/database')
jest.mock('../src/paymentHandlers')
jest.mock('../src/utils', () => ({
  ...jest.requireActual('../src/utils'),
  isAdmin: jest.fn((userId: number) => userId === 123),
  getMainMenuKeyboard: jest.fn(() => ({ inline_keyboard: [] })),
  processCouponCode: jest.fn(),
  processCouponGeneration: jest.fn(),
}));

// Mock constants and config
jest.mock('../src/constants', () => ({
  ...jest.requireActual('../src/constants'), // Import and retain original constants
  BOT_MESSAGES: {
    start: jest.fn((name: string) => `Hello ${name}`),
    mainMenu: jest.fn((balance: string) => `Your balance: $${balance}`),
    processing: '⚙️ Processing...',
    searching: jest.fn((count: number) => `🔎 Searching for ${count} items...`),
    searchComplete: '✅ Search complete. Creating report...',
    noPartNumbers: 'Please provide at least one part number.',
    error: 'An unexpected error occurred.',
    insufficientFunds: '🚫 Insufficient funds.',
    requestComplete: jest.fn((cost: string, balance: string) => `✅ Success! Cost: $${cost}. Balance: $${balance}.`),
    requestCompleteFree: '✅ Request completed!',
    noItemsFoundAndRefund: jest.fn((balance: string) => `🤷 No items found. Refunded. Balance: $${balance}.`),
    noItemsFound: '🤷 No items found.',
    refundOnEror: jest.fn((balance: string) => `⚠️ Error. Refunded. Balance: $${balance}.`),
    enterCouponCode: 'Please enter your coupon code:',
    enterCouponValue: 'Enter coupon value:',
    adminOnly: 'Admin only',
    currentBalance: jest.fn((balance: string) => `Current balance: $${balance}`),
  },
}))
jest.mock('../src/config', () => ({
  config: {
    telegramToken: 'fake-token',
    adminId: 123,
    costPerRequestCents: 2, // Use a value > 1 for better testing
    paymentsEnabled: true,
  },
}))

// --- Mocks --- //
const MockTelegramBot = TelegramBot as jest.MockedClass<typeof TelegramBot>
const mockFindItem = findItem as jest.Mock
const mockCreateExcelReport = createExcelReport as jest.Mock
const mockGetOrCreateUser = getOrCreateUser as jest.Mock
const mockUpdateUserBalance = updateUserBalance as jest.Mock
const mockGetUser = getUser as jest.Mock

  let botInstance: TelegramBot

  let sendMessageSpy: jest.Mock = jest.fn()

  let sendDocumentSpy: jest.Mock = jest.fn()



  let onTextHandler: (msg: TelegramBot.Message, match: RegExpExecArray | null) => Promise<void>

  let onMessageHandler: (msg: TelegramBot.Message) => Promise<void>

  let onCallbackQueryHandler: (query: TelegramBot.CallbackQuery) => Promise<void>



  beforeEach(() => {

    jest.clearAllMocks()

    // Reset the mock implementations for sendMessageSpy and sendDocumentSpy
    sendMessageSpy.mockClear();
    sendDocumentSpy.mockClear();

    MockTelegramBot.mockImplementation(() => {
      const instance = {
        on: jest.fn((event, handler) => {
          if (event === 'message') {
            onMessageHandler = handler
          } else if (event === 'callback_query') {
            onCallbackQueryHandler = handler
          }
        }),
        onText: jest.fn((regexp, handler) => {
          if (regexp.source === '/start') {
            onTextHandler = handler
          }
        }),
        sendMessage: sendMessageSpy,
        sendDocument: sendDocumentSpy,
        answerCallbackQuery: jest.fn(),
        startPolling: jest.fn(), // Added startPolling mock
        stopPolling: jest.fn(),
        removeWebHook: jest.fn(),
        getMe: jest.fn().mockResolvedValue({ username: 'testbot' }),
      } as unknown as TelegramBot
      return instance
    })

    initializeBot()
    botInstance = MockTelegramBot.mock.results[0].value

    // Reset mocks for database functions before each test
    mockGetOrCreateUser.mockReset();
    mockUpdateUserBalance.mockReset();
    mockGetUser.mockReset();
  });
  const simulateStartCommand = async (from: { id: number; username: string; first_name: string } = { id: 123, username: 'testuser', first_name: 'Test' }) => {
    const msg = { chat: { id: from.id }, from } as TelegramBot.Message
    await onTextHandler(msg, null)
  }

  const simulateMessage = async (text: string, from: { id: number; username: string; first_name?: string } = { id: 123, username: 'testuser' }, reply_to_message?: TelegramBot.Message) => {
    const msg = { chat: { id: from.id }, from, text, reply_to_message } as TelegramBot.Message
    await onMessageHandler(msg)
  }

  const simulateCallbackQuery = async (data: string, from: { id: number; username: string; first_name?: string } = { id: 123, username: 'testuser' }) => {
    const query = { id: 'queryId', from, message: { chat: { id: from.id } }, data } as TelegramBot.CallbackQuery
    await onCallbackQueryHandler(query)
  }

  describe('Bot Initialization', () => {
    it('should initialize the bot and start polling', () => {
      expect(MockTelegramBot).toHaveBeenCalledTimes(1);
      expect(botInstance.startPolling).toHaveBeenCalledTimes(1);
      expect(botInstance.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(botInstance.onText).toHaveBeenCalledWith(new RegExp('/start'), expect.any(Function));
      expect(botInstance.on).toHaveBeenCalledWith('callback_query', expect.any(Function));
    });
  });

  describe('Start Command', () => {
    it('should send a welcome message and main menu on /start', async () => {
      mockGetOrCreateUser.mockResolvedValue({ user_id: 123, balance_cents: 500, username: 'testuser' });

      await simulateStartCommand();

      expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.start('Test'), expect.any(Object));
      expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.mainMenu('5.00'), expect.any(Object));
    });
  });

  describe('Cost Calculation and Balance', () => {
    it('should calculate total cost based on number of parts', async () => {
      mockGetOrCreateUser.mockResolvedValue({ user_id: 123, balance_cents: 100, username: 'test' })
      mockFindItem.mockResolvedValue({ title: 'Item', price: '10' })
      mockCreateExcelReport.mockResolvedValue(Buffer.from('excel'))

      await simulateMessage('PN1, PN2, PN3') // 3 parts

      const expectedCost = 3 * config.costPerRequestCents
      const expectedNewBalance = 100 - expectedCost

      expect(mockUpdateUserBalance).toHaveBeenCalledWith(123, expectedNewBalance)
      expect(sendMessageSpy).toHaveBeenCalledWith(
        123,
        BOT_MESSAGES.requestComplete((expectedCost / 100).toFixed(2), (expectedNewBalance / 100).toFixed(2))
      )
      expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.mainMenu((expectedNewBalance / 100).toFixed(2)), expect.any(Object));
    })

    it('should block request if balance is insufficient', async () => {
      mockGetOrCreateUser.mockResolvedValue({ user_id: 123, balance_cents: 5, username: 'test' })

      await simulateMessage('PN1, PN2, PN3, PN4') // Cost = 8 cents

      expect(mockUpdateUserBalance).not.toHaveBeenCalled()
      expect(mockFindItem).not.toHaveBeenCalled()
      expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.insufficientFunds, expect.any(Object))
    })
  })

  describe('Refund Logic', () => {
    const initialBalance = 100
    beforeEach(() => {
      mockGetOrCreateUser.mockResolvedValue({ user_id: 123, balance_cents: initialBalance, username: 'test' })
      mockGetUser.mockResolvedValue({ user_id: 123, balance_cents: initialBalance, username: 'test' });
      mockUpdateUserBalance.mockClear(); // Clear calls from previous tests
    })

    it('should refund cost if no items are found', async () => {
      mockFindItem.mockResolvedValue(null) // No items found

      await simulateMessage('PN1, PN2')

      const cost = 2 * config.costPerRequestCents
      // First, balance is deducted
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(123, initialBalance - cost)
      // Then, it's refunded
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(123, initialBalance)
      expect(mockUpdateUserBalance).toHaveBeenCalledTimes(2)

      expect(sendMessageSpy).toHaveBeenCalledWith(
        123,
        BOT_MESSAGES.noItemsFoundAndRefund((initialBalance / 100).toFixed(2))
      )
      expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.mainMenu((initialBalance / 100).toFixed(2)), expect.any(Object));
      expect(mockCreateExcelReport).not.toHaveBeenCalled()
    })

    it('should refund cost on internal error', async () => {
      const apiError = new Error('eBay API is down')
      mockFindItem.mockRejectedValue(apiError)

      await simulateMessage('PN1')

      const cost = 1 * config.costPerRequestCents
      // First, balance is deducted
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(123, initialBalance - cost)
      // Then, it's refunded
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(123, initialBalance)
      expect(mockUpdateUserBalance).toHaveBeenCalledTimes(2)

      expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.error)
      expect(sendMessageSpy).toHaveBeenCalledWith(
        123,
        BOT_MESSAGES.mainMenu((initialBalance / 100).toFixed(2)),
        expect.any(Object)
      )
      expect(mockCreateExcelReport).not.toHaveBeenCalled()
    })
  })

  describe('Callback Queries', () => {
    it('should handle check_balance callback', async () => {
      mockGetUser.mockResolvedValue({ user_id: 123, balance_cents: 750 });

      await simulateCallbackQuery('check_balance');

      expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.currentBalance('7.50'), expect.any(Object));
      expect(botInstance.answerCallbackQuery).toHaveBeenCalledWith('queryId');
    });

    it('should handle redeem_prompt callback', async () => {
      await simulateCallbackQuery('redeem_prompt');

      expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.enterCouponCode, expect.any(Object));
      expect(botInstance.answerCallbackQuery).toHaveBeenCalledWith('queryId');
    });

    it('should handle generate_coupon_prompt callback for admin', async () => {
      await simulateCallbackQuery('generate_coupon_prompt', { id: 123, username: 'admin', first_name: 'Admin' });

      expect(sendMessageSpy).toHaveBeenCalledWith(123, BOT_MESSAGES.enterCouponValue, expect.any(Object));
      expect(botInstance.answerCallbackQuery).toHaveBeenCalledWith('queryId');
    });

    it('should not handle generate_coupon_prompt callback for non-admin', async () => {
      await simulateCallbackQuery('generate_coupon_prompt', { id: 456, username: 'user', first_name: 'User' });

      expect(sendMessageSpy).not.toHaveBeenCalledWith(123, BOT_MESSAGES.enterCouponValue, expect.any(Object));
      expect(botInstance.answerCallbackQuery).toHaveBeenCalledWith('queryId', { text: BOT_MESSAGES.adminOnly });
    });
  });

  describe('Coupon Processing', () => {
    it('should process coupon code from reply', async () => {
      const mockMsg = { chat: { id: 123 }, from: { id: 123, username: 'testuser' }, text: 'COUPON123', reply_to_message: { text: BOT_MESSAGES.enterCouponCode } } as TelegramBot.Message;
      await onMessageHandler(mockMsg);
      expect(require('../src/utils').processCouponCode).toHaveBeenCalledWith(botInstance, mockMsg, 'COUPON123');
    });

    it('should process coupon generation from reply', async () => {
      const mockMsg = { chat: { id: 123 }, from: { id: 123, username: 'testuser' }, text: '10.00', reply_to_message: { text: BOT_MESSAGES.enterCouponValue } } as TelegramBot.Message;
      await onMessageHandler(mockMsg);
      expect(require('../src/utils').processCouponGeneration).toHaveBeenCalledWith(botInstance, mockMsg, '10.00');
    });
  });