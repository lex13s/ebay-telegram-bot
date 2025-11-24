/**
 * Domain Errors
 */

import {
  DomainError,
  InsufficientFundsError,
  InvalidCouponError,
  UserNotFoundError,
  CouponNotFoundError,
  InvalidPartNumberError,
} from '../../src/domain/errors/DomainErrors';

describe('Domain Layer - Errors', () => {
  describe('DomainError', () => {
    it('should be instance of Error', () => {
      class TestError extends DomainError {
        constructor() {
          super('Test error message');
        }
      }

      const error = new TestError();
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
    });

    it('should set correct name from constructor', () => {
      class CustomDomainError extends DomainError {
        constructor() {
          super('Custom error');
        }
      }

      const error = new CustomDomainError();
      expect(error.name).toBe('CustomDomainError');
    });

    it('should capture stack trace', () => {
      class TestError extends DomainError {
        constructor() {
          super('Test error');
        }
      }

      const error = new TestError();
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestError');
    });
  });

  describe('InsufficientFundsError', () => {
    it('should create error with correct message for cents', () => {
      const required = 10000; // $100.00
      const available = 5000; // $50.00

      const error = new InsufficientFundsError(required, available);

      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('InsufficientFundsError');
      expect(error.message).toBe('Insufficient funds: required $100.00, available $50.00');
    });

    it('should format dollars correctly with decimal places', () => {
      const required = 12550; // $125.50
      const available = 7525; // $75.25

      const error = new InsufficientFundsError(required, available);

      expect(error.message).toBe('Insufficient funds: required $125.50, available $75.25');
    });

    it('should handle zero amounts', () => {
      const required = 1000; // $10.00
      const available = 0; // $0.00

      const error = new InsufficientFundsError(required, available);

      expect(error.message).toBe('Insufficient funds: required $10.00, available $0.00');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new InsufficientFundsError(5000, 2000);
      }).toThrow(InsufficientFundsError);

      expect(() => {
        throw new InsufficientFundsError(5000, 2000);
      }).toThrow('Insufficient funds: required $50.00, available $20.00');
    });
  });

  describe('InvalidCouponError', () => {
    it('should create error with default message', () => {
      const error = new InvalidCouponError();

      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('InvalidCouponError');
      expect(error.message).toBe('Invalid or already used coupon');
    });

    it('should create error with custom message', () => {
      const customMessage = 'Coupon has expired';
      const error = new InvalidCouponError(customMessage);

      expect(error.message).toBe(customMessage);
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new InvalidCouponError();
      }).toThrow(InvalidCouponError);

      expect(() => {
        throw new InvalidCouponError('Custom error');
      }).toThrow('Custom error');
    });
  });

  describe('UserNotFoundError', () => {
    it('should create error with user id in message', () => {
      const userId = 123456;
      const error = new UserNotFoundError(userId);

      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('UserNotFoundError');
      expect(error.message).toBe('User not found: 123456');
    });

    it('should handle different user ids', () => {
      const error1 = new UserNotFoundError(999);
      const error2 = new UserNotFoundError(111222333);

      expect(error1.message).toBe('User not found: 999');
      expect(error2.message).toBe('User not found: 111222333');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new UserNotFoundError(123);
      }).toThrow(UserNotFoundError);

      expect(() => {
        throw new UserNotFoundError(123);
      }).toThrow('User not found: 123');
    });
  });

  describe('CouponNotFoundError', () => {
    it('should create error with coupon code in message', () => {
      const code = 'ABCD-1234-EFGH';
      const error = new CouponNotFoundError(code);

      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('CouponNotFoundError');
      expect(error.message).toBe('Coupon not found: ABCD-1234-EFGH');
    });

    it('should handle different coupon codes', () => {
      const error1 = new CouponNotFoundError('TEST-CODE-1');
      const error2 = new CouponNotFoundError('INVALID123');

      expect(error1.message).toBe('Coupon not found: TEST-CODE-1');
      expect(error2.message).toBe('Coupon not found: INVALID123');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new CouponNotFoundError('XYZ-999');
      }).toThrow(CouponNotFoundError);

      expect(() => {
        throw new CouponNotFoundError('XYZ-999');
      }).toThrow('Coupon not found: XYZ-999');
    });
  });

  describe('InvalidPartNumberError', () => {
    it('should create error with part number in message', () => {
      const partNumber = 'INVALID-PART';
      const error = new InvalidPartNumberError(partNumber);

      expect(error).toBeInstanceOf(DomainError);
      expect(error.name).toBe('InvalidPartNumberError');
      expect(error.message).toBe('Invalid part number: INVALID-PART');
    });

    it('should handle different part numbers', () => {
      const error1 = new InvalidPartNumberError('');
      const error2 = new InvalidPartNumberError('   ');
      const error3 = new InvalidPartNumberError('TOO-LONG-PART-NUMBER-12345678901234567890');

      expect(error1.message).toBe('Invalid part number: ');
      expect(error2.message).toBe('Invalid part number:    ');
      expect(error3.message).toBe('Invalid part number: TOO-LONG-PART-NUMBER-12345678901234567890');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new InvalidPartNumberError('BAD-PART');
      }).toThrow(InvalidPartNumberError);

      expect(() => {
        throw new InvalidPartNumberError('BAD-PART');
      }).toThrow('Invalid part number: BAD-PART');
    });
  });

  describe('Error Type Guards', () => {
    it('should differentiate between error types', () => {
      const insufficientFunds = new InsufficientFundsError(1000, 500);
      const invalidCoupon = new InvalidCouponError();
      const userNotFound = new UserNotFoundError(123);

      expect(insufficientFunds instanceof InsufficientFundsError).toBe(true);
      expect(insufficientFunds instanceof InvalidCouponError).toBe(false);

      expect(invalidCoupon instanceof InvalidCouponError).toBe(true);
      expect(invalidCoupon instanceof UserNotFoundError).toBe(false);

      expect(userNotFound instanceof UserNotFoundError).toBe(true);
      expect(userNotFound instanceof CouponNotFoundError).toBe(false);
    });

    it('all errors should be instances of DomainError', () => {
      const errors = [
        new InsufficientFundsError(1000, 500),
        new InvalidCouponError(),
        new UserNotFoundError(123),
        new CouponNotFoundError('CODE'),
        new InvalidPartNumberError('PART'),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(DomainError);
        expect(error).toBeInstanceOf(Error);
      });
    });
  });

  describe('Error Handling in Try-Catch', () => {
    it('should be catchable as DomainError base class', () => {
      try {
        throw new InsufficientFundsError(1000, 500);
      } catch (error) {
        expect(error).toBeInstanceOf(DomainError);
        expect(error).toBeInstanceOf(InsufficientFundsError);
      }
    });

    it('should be catchable as specific error type', () => {
      try {
        throw new UserNotFoundError(123);
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          expect(error.message).toContain('User not found');
        } else {
          fail('Should have caught UserNotFoundError');
        }
      }
    });

    it('should preserve error information through throw/catch', () => {
      const originalError = new CouponNotFoundError('TEST-123');

      try {
        throw originalError;
      } catch (caughtError) {
        expect(caughtError).toBe(originalError);
        expect((caughtError as Error).name).toBe('CouponNotFoundError');
        expect((caughtError as Error).message).toBe('Coupon not found: TEST-123');
      }
    });
  });
});
