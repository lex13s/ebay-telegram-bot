import TelegramBot from 'node-telegram-bot-api'
import { initializeBot } from '../src/bot'
import { findItem } from '../src/ebay'
import { createExcelReport } from '../src/excel'
import {
  getOrCreateUser,
  updateUserBalance,
} from '../src/database'
import { config } from '../src/config'

// Mock external dependencies
jest.mock('node-telegram-bot-api')
jest.mock('../src/ebay')
jest.mock('../src/excel')
jest.mock('../src/database')
jest.mock('../src/paymentHandlers')

// Mock constants and config
jest.mock('../src/constants', () => ({
  ...jest.requireActual('../src/constants'), // Import and retain original constants
  BOT_MESSAGES: {
    start: jest.fn((name, balance) => `Hello ${name}, balance: ${balance}`),
    processing: '⚙️ Processing...',
    searching: (count: number) => `🔎 Searching for ${count} items...`,
    searchComplete: '✅ Search complete. Generating report...',
    noPartNumbers: 'Please provide at least one part number.',
    error: 'An unexpected error occurred.',
    insufficientFunds: '🚫 Insufficient funds.',
    requestComplete: (cost: string, balance: string) => `✅ Success! Cost: $${cost}. Balance: $${balance}.`,
    noItemsFoundAndRefund: (balance: string) => `🤷 No items found. Refunded. Balance: $${balance}.`,
    refundOnEror: (balance: string) => `⚠️ Error. Refunded. Balance: $${balance}.`,
  },
}))
jest.mock('../src/config', () => ({
  config: {
    telegramToken: 'fake-token',
    costPerRequestCents: 2, // Use a value > 1 for better testing
  },
}))

// --- Mocks --- //
const MockTelegramBot = TelegramBot as jest.MockedClass<typeof TelegramBot>
const mockFindItem = findItem as jest.Mock
const mockCreateExcelReport = createExcelReport as jest.Mock
const mockGetOrCreateUser = getOrCreateUser as jest.Mock
const mockUpdateUserBalance = updateUserBalance as jest.Mock

describe('Bot Logic', () => {
  let botInstance: TelegramBot
  let sendMessageSpy: jest.Mock
  let sendDocumentSpy: jest.Mock
  let messageHandler: (msg: TelegramBot.Message) => Promise<void>

  beforeEach(() => {
    jest.clearAllMocks()

    sendMessageSpy = jest.fn()
    sendDocumentSpy = jest.fn()

    MockTelegramBot.mockImplementation(() => {
      const instance = {
        on: jest.fn(),
        onText: jest.fn(),
        sendMessage: sendMessageSpy,
        sendDocument: sendDocumentSpy,
        answerCallbackQuery: jest.fn(),
      } as unknown as TelegramBot
      // Capture the message handler
      instance.on = jest.fn((event, handler) => {
        if (event === 'message') {
          messageHandler = handler
        }
        return instance // Return instance for chaining
      })
      return instance
    })

    initializeBot()
    botInstance = MockTelegramBot.mock.results[0].value
  })

  const simulateMessage = (text: string, from = { id: 123, username: 'testuser' }) => {
    const msg = { chat: { id: 123 }, from, text } as TelegramBot.Message
    return messageHandler(msg)
  }

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
        `✅ Success! Cost: $${(expectedCost / 100).toFixed(2)}. Balance: $${(expectedNewBalance / 100).toFixed(2)}.`
      )
    })

    it('should block request if balance is insufficient', async () => {
      mockGetOrCreateUser.mockResolvedValue({ user_id: 123, balance_cents: 5, username: 'test' })

      await simulateMessage('PN1, PN2, PN3, PN4') // Cost = 8 cents

      expect(mockUpdateUserBalance).not.toHaveBeenCalled()
      expect(mockFindItem).not.toHaveBeenCalled()
      expect(sendMessageSpy).toHaveBeenCalledWith(123, '🚫 Insufficient funds.', expect.any(Object))
    })
  })

  describe('Refund Logic', () => {
    const initialBalance = 100
    beforeEach(() => {
      mockGetOrCreateUser.mockResolvedValue({ user_id: 123, balance_cents: initialBalance, username: 'test' })
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
        `🤷 No items found. Refunded. Balance: $${(initialBalance / 100).toFixed(2)}.`
      )
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

      expect(sendMessageSpy).toHaveBeenCalledWith(123, 'An unexpected error occurred.')
      expect(sendMessageSpy).toHaveBeenCalledWith(
        123,
        `⚠️ Error. Refunded. Balance: $${(initialBalance / 100).toFixed(2)}.`
      )
      expect(mockCreateExcelReport).not.toHaveBeenCalled()
    })
  })
})