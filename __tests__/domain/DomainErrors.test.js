"use strict";
/**
 * Тесты для Domain Errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
const DomainErrors_1 = require("../../src/domain/errors/DomainErrors");
describe('Domain Layer - Errors', () => {
    describe('DomainError', () => {
        it('should be instance of Error', () => {
            class TestError extends DomainErrors_1.DomainError {
                constructor() {
                    super('Test error message');
                }
            }
            const error = new TestError();
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(DomainErrors_1.DomainError);
        });
        it('should set correct name from constructor', () => {
            class CustomDomainError extends DomainErrors_1.DomainError {
                constructor() {
                    super('Custom error');
                }
            }
            const error = new CustomDomainError();
            expect(error.name).toBe('CustomDomainError');
        });
        it('should capture stack trace', () => {
            class TestError extends DomainErrors_1.DomainError {
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
            const error = new DomainErrors_1.InsufficientFundsError(required, available);
            expect(error).toBeInstanceOf(DomainErrors_1.DomainError);
            expect(error.name).toBe('InsufficientFundsError');
            expect(error.message).toBe('Insufficient funds: required $100.00, available $50.00');
        });
        it('should format dollars correctly with decimal places', () => {
            const required = 12550; // $125.50
            const available = 7525; // $75.25
            const error = new DomainErrors_1.InsufficientFundsError(required, available);
            expect(error.message).toBe('Insufficient funds: required $125.50, available $75.25');
        });
        it('should handle zero amounts', () => {
            const required = 1000; // $10.00
            const available = 0; // $0.00
            const error = new DomainErrors_1.InsufficientFundsError(required, available);
            expect(error.message).toBe('Insufficient funds: required $10.00, available $0.00');
        });
        it('should be throwable and catchable', () => {
            expect(() => {
                throw new DomainErrors_1.InsufficientFundsError(5000, 2000);
            }).toThrow(DomainErrors_1.InsufficientFundsError);
            expect(() => {
                throw new DomainErrors_1.InsufficientFundsError(5000, 2000);
            }).toThrow('Insufficient funds: required $50.00, available $20.00');
        });
    });
    describe('InvalidCouponError', () => {
        it('should create error with default message', () => {
            const error = new DomainErrors_1.InvalidCouponError();
            expect(error).toBeInstanceOf(DomainErrors_1.DomainError);
            expect(error.name).toBe('InvalidCouponError');
            expect(error.message).toBe('Invalid or already used coupon');
        });
        it('should create error with custom message', () => {
            const customMessage = 'Coupon has expired';
            const error = new DomainErrors_1.InvalidCouponError(customMessage);
            expect(error.message).toBe(customMessage);
        });
        it('should be throwable and catchable', () => {
            expect(() => {
                throw new DomainErrors_1.InvalidCouponError();
            }).toThrow(DomainErrors_1.InvalidCouponError);
            expect(() => {
                throw new DomainErrors_1.InvalidCouponError('Custom error');
            }).toThrow('Custom error');
        });
    });
    describe('UserNotFoundError', () => {
        it('should create error with user id in message', () => {
            const userId = 123456;
            const error = new DomainErrors_1.UserNotFoundError(userId);
            expect(error).toBeInstanceOf(DomainErrors_1.DomainError);
            expect(error.name).toBe('UserNotFoundError');
            expect(error.message).toBe('User not found: 123456');
        });
        it('should handle different user ids', () => {
            const error1 = new DomainErrors_1.UserNotFoundError(999);
            const error2 = new DomainErrors_1.UserNotFoundError(111222333);
            expect(error1.message).toBe('User not found: 999');
            expect(error2.message).toBe('User not found: 111222333');
        });
        it('should be throwable and catchable', () => {
            expect(() => {
                throw new DomainErrors_1.UserNotFoundError(123);
            }).toThrow(DomainErrors_1.UserNotFoundError);
            expect(() => {
                throw new DomainErrors_1.UserNotFoundError(123);
            }).toThrow('User not found: 123');
        });
    });
    describe('CouponNotFoundError', () => {
        it('should create error with coupon code in message', () => {
            const code = 'ABCD-1234-EFGH';
            const error = new DomainErrors_1.CouponNotFoundError(code);
            expect(error).toBeInstanceOf(DomainErrors_1.DomainError);
            expect(error.name).toBe('CouponNotFoundError');
            expect(error.message).toBe('Coupon not found: ABCD-1234-EFGH');
        });
        it('should handle different coupon codes', () => {
            const error1 = new DomainErrors_1.CouponNotFoundError('TEST-CODE-1');
            const error2 = new DomainErrors_1.CouponNotFoundError('INVALID123');
            expect(error1.message).toBe('Coupon not found: TEST-CODE-1');
            expect(error2.message).toBe('Coupon not found: INVALID123');
        });
        it('should be throwable and catchable', () => {
            expect(() => {
                throw new DomainErrors_1.CouponNotFoundError('XYZ-999');
            }).toThrow(DomainErrors_1.CouponNotFoundError);
            expect(() => {
                throw new DomainErrors_1.CouponNotFoundError('XYZ-999');
            }).toThrow('Coupon not found: XYZ-999');
        });
    });
    describe('InvalidPartNumberError', () => {
        it('should create error with part number in message', () => {
            const partNumber = 'INVALID-PART';
            const error = new DomainErrors_1.InvalidPartNumberError(partNumber);
            expect(error).toBeInstanceOf(DomainErrors_1.DomainError);
            expect(error.name).toBe('InvalidPartNumberError');
            expect(error.message).toBe('Invalid part number: INVALID-PART');
        });
        it('should handle different part numbers', () => {
            const error1 = new DomainErrors_1.InvalidPartNumberError('');
            const error2 = new DomainErrors_1.InvalidPartNumberError('   ');
            const error3 = new DomainErrors_1.InvalidPartNumberError('TOO-LONG-PART-NUMBER-12345678901234567890');
            expect(error1.message).toBe('Invalid part number: ');
            expect(error2.message).toBe('Invalid part number:    ');
            expect(error3.message).toBe('Invalid part number: TOO-LONG-PART-NUMBER-12345678901234567890');
        });
        it('should be throwable and catchable', () => {
            expect(() => {
                throw new DomainErrors_1.InvalidPartNumberError('BAD-PART');
            }).toThrow(DomainErrors_1.InvalidPartNumberError);
            expect(() => {
                throw new DomainErrors_1.InvalidPartNumberError('BAD-PART');
            }).toThrow('Invalid part number: BAD-PART');
        });
    });
    describe('Error Type Guards', () => {
        it('should differentiate between error types', () => {
            const insufficientFunds = new DomainErrors_1.InsufficientFundsError(1000, 500);
            const invalidCoupon = new DomainErrors_1.InvalidCouponError();
            const userNotFound = new DomainErrors_1.UserNotFoundError(123);
            expect(insufficientFunds instanceof DomainErrors_1.InsufficientFundsError).toBe(true);
            expect(insufficientFunds instanceof DomainErrors_1.InvalidCouponError).toBe(false);
            expect(invalidCoupon instanceof DomainErrors_1.InvalidCouponError).toBe(true);
            expect(invalidCoupon instanceof DomainErrors_1.UserNotFoundError).toBe(false);
            expect(userNotFound instanceof DomainErrors_1.UserNotFoundError).toBe(true);
            expect(userNotFound instanceof DomainErrors_1.CouponNotFoundError).toBe(false);
        });
        it('all errors should be instances of DomainError', () => {
            const errors = [
                new DomainErrors_1.InsufficientFundsError(1000, 500),
                new DomainErrors_1.InvalidCouponError(),
                new DomainErrors_1.UserNotFoundError(123),
                new DomainErrors_1.CouponNotFoundError('CODE'),
                new DomainErrors_1.InvalidPartNumberError('PART'),
            ];
            errors.forEach((error) => {
                expect(error).toBeInstanceOf(DomainErrors_1.DomainError);
                expect(error).toBeInstanceOf(Error);
            });
        });
    });
    describe('Error Handling in Try-Catch', () => {
        it('should be catchable as DomainError base class', () => {
            try {
                throw new DomainErrors_1.InsufficientFundsError(1000, 500);
            }
            catch (error) {
                expect(error).toBeInstanceOf(DomainErrors_1.DomainError);
                expect(error).toBeInstanceOf(DomainErrors_1.InsufficientFundsError);
            }
        });
        it('should be catchable as specific error type', () => {
            try {
                throw new DomainErrors_1.UserNotFoundError(123);
            }
            catch (error) {
                if (error instanceof DomainErrors_1.UserNotFoundError) {
                    expect(error.message).toContain('User not found');
                }
                else {
                    fail('Should have caught UserNotFoundError');
                }
            }
        });
        it('should preserve error information through throw/catch', () => {
            const originalError = new DomainErrors_1.CouponNotFoundError('TEST-123');
            try {
                throw originalError;
            }
            catch (caughtError) {
                expect(caughtError).toBe(originalError);
                expect(caughtError.name).toBe('CouponNotFoundError');
                expect(caughtError.message).toBe('Coupon not found: TEST-123');
            }
        });
    });
});
