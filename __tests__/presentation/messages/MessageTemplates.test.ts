/**
 * MessageTemplates
 */

import { MessageTemplates } from '../../../src/presentation/messages/MessageTemplates';

describe('Presentation Layer - Messages: MessageTemplates', () => {
  describe('start', () => {
    it('should format start message with first name', () => {
      const message = MessageTemplates.start('John');

      expect(message).toContain('John');
      expect(message).toContain('Hello');
      expect(message).toContain('part number');
    });

    it('should handle different names', () => {
      expect(MessageTemplates.start('Alice')).toContain('Alice');
      expect(MessageTemplates.start('Иван')).toContain('Иван');
      expect(MessageTemplates.start('123')).toContain('123');
    });
  });

  describe('mainMenu', () => {
    it('should format main menu with balance', () => {
      const message = MessageTemplates.mainMenu('100.00');

      expect(message).toContain('$100.00');
      expect(message).toContain('balance');
    });

    it('should handle different balance values', () => {
      expect(MessageTemplates.mainMenu('0.00')).toContain('$0.00');
      expect(MessageTemplates.mainMenu('1234.56')).toContain('$1234.56');
    });
  });

  describe('processing messages', () => {
    it('should return processing message', () => {
      const message = MessageTemplates.processing();
      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(0);
    });

    it('should return searching message with count', () => {
      expect(MessageTemplates.searching(1)).toContain('1');
      expect(MessageTemplates.searching(5)).toContain('5');
      expect(MessageTemplates.searching(100)).toContain('100');
    });

    it('should return search complete message', () => {
      const message = MessageTemplates.searchComplete();
      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(0);
    });
  });

  describe('balance messages', () => {
    it('should format current balance', () => {
      const message = MessageTemplates.currentBalance('50.00');
      expect(message).toContain('$50.00');
      expect(message).toContain('balance');
    });

    it('should return insufficient funds message', () => {
      const message = MessageTemplates.insufficientFunds();
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).toContain('insufficient');
    });

    it('should format request complete with cost and balance', () => {
      const message = MessageTemplates.requestComplete('5.00', '45.00');
      expect(message).toContain('$5.00');
      expect(message).toContain('$45.00');
    });

    it('should return free request complete message', () => {
      const message = MessageTemplates.requestCompleteFree();
      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(0);
    });
  });

  describe('error messages', () => {
    it('should return no part numbers message', () => {
      const message = MessageTemplates.noPartNumbers();
      expect(message).toBeTruthy();
    });

    it('should return general error message', () => {
      const message = MessageTemplates.error();
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).toContain('error');
    });

    it('should return no items found message', () => {
      const message = MessageTemplates.noItemsFound();
      expect(message).toBeTruthy();
    });

    it('should format no items with refund message', () => {
      const message = MessageTemplates.noItemsFoundAndRefund('100.00');
      expect(message).toContain('$100.00');
    });

    it('should format refund on error message', () => {
      const message = MessageTemplates.refundOnError('75.50');
      expect(message).toContain('$75.50');
    });
  });

  describe('coupon messages', () => {
    it('should return enter coupon code prompt', () => {
      const message = MessageTemplates.enterCouponCode();
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).toContain('coupon');
    });

    it('should return coupon not found message', () => {
      const message = MessageTemplates.redeemCouponNotFound();
      expect(message).toBeTruthy();
    });

    it('should format coupon success with amount and balance', () => {
      const message = MessageTemplates.redeemCouponSuccess('25.00', '125.00');
      expect(message).toContain('$25.00');
      expect(message).toContain('$125.00');
    });
  });

  describe('admin messages', () => {
    it('should return admin only message', () => {
      const message = MessageTemplates.adminOnly();
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).toContain('admin');
    });

    it('should return enter coupon value prompt', () => {
      const message = MessageTemplates.enterCouponValue();
      expect(message).toBeTruthy();
    });

    it('should format generate coupon success', () => {
      const message = MessageTemplates.generateCouponSuccess('ABC-123', '50.00');
      expect(message).toContain('ABC-123');
      expect(message).toContain('$50.00');
    });

    it('should return generate coupon error', () => {
      const message = MessageTemplates.generateCouponError();
      expect(message).toBeTruthy();
      expect(message.toLowerCase()).toContain('error');
    });
  });

  describe('payment messages', () => {
    it('should return payments disabled message', () => {
      const message = MessageTemplates.paymentsDisabled();
      expect(message).toBeTruthy();
    });

    it('should return invoice title', () => {
      const message = MessageTemplates.invoiceTitle();
      expect(message).toBeTruthy();
    });
  });

  describe('message format consistency', () => {
    it('all messages should be non-empty strings', () => {
      const methods = [
        () => MessageTemplates.start('Test'),
        () => MessageTemplates.mainMenu('10.00'),
        () => MessageTemplates.processing(),
        () => MessageTemplates.searching(1),
        () => MessageTemplates.searchComplete(),
        () => MessageTemplates.currentBalance('10.00'),
        () => MessageTemplates.insufficientFunds(),
        () => MessageTemplates.requestComplete('1.00', '9.00'),
        () => MessageTemplates.requestCompleteFree(),
        () => MessageTemplates.noPartNumbers(),
        () => MessageTemplates.error(),
        () => MessageTemplates.noItemsFound(),
        () => MessageTemplates.noItemsFoundAndRefund('10.00'),
        () => MessageTemplates.refundOnError('10.00'),
        () => MessageTemplates.enterCouponCode(),
        () => MessageTemplates.redeemCouponNotFound(),
        () => MessageTemplates.redeemCouponSuccess('5.00', '15.00'),
        () => MessageTemplates.adminOnly(),
        () => MessageTemplates.enterCouponValue(),
        () => MessageTemplates.generateCouponSuccess('ABC', '10.00'),
        () => MessageTemplates.generateCouponError(),
        () => MessageTemplates.paymentsDisabled(),
        () => MessageTemplates.invoiceTitle(),
      ];

      methods.forEach((method) => {
        const result = method();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('emoji usage', () => {
    it('should include emojis in appropriate messages', () => {
      expect(MessageTemplates.start('Test')).toMatch(/👋|🔍|📋/);
      expect(MessageTemplates.insufficientFunds()).toMatch(/🚫|❌/);
      expect(MessageTemplates.noItemsFound()).toMatch(/❌/);
      expect(MessageTemplates.requestComplete('1', '9')).toMatch(/✅/);
    });
  });

  describe('special characters handling', () => {
    it('should handle special characters in names', () => {
      expect(() => MessageTemplates.start("O'Brien")).not.toThrow();
      expect(() => MessageTemplates.start('José')).not.toThrow();
      expect(() => MessageTemplates.start('李明')).not.toThrow();
    });

    it('should handle various number formats', () => {
      expect(() => MessageTemplates.mainMenu('0')).not.toThrow();
      expect(() => MessageTemplates.mainMenu('0.00')).not.toThrow();
      expect(() => MessageTemplates.mainMenu('999999.99')).not.toThrow();
    });
  });

  describe('message length', () => {
    it('all messages should be reasonable length for Telegram', () => {
      const maxTelegramLength = 4096;
      const methods = [
        MessageTemplates.start('TestUser'),
        MessageTemplates.mainMenu('100.00'),
        MessageTemplates.generateCouponSuccess('ABCD-1234', '50.00'),
      ];

      methods.forEach((message) => {
        expect(message.length).toBeLessThan(maxTelegramLength);
      });
    });
  });
});
