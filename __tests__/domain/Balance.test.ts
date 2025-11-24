/**
 * Value Object: Balance
 */

import { Balance } from '../../src/domain/value-objects/Balance';

describe('Domain Layer - Value Object: Balance', () => {
  describe('create', () => {
    it('should create Balance with valid positive cents', () => {
      const balance = Balance.create(10000); // 100.00 USD in cents
      expect(balance.getCents()).toBe(10000);
      expect(balance.getDollars()).toBe(100);
    });

    it('should create Balance with zero amount', () => {
      const balance = Balance.create(0);
      expect(balance.getCents()).toBe(0);
      expect(balance.getDollars()).toBe(0);
    });

    it('should throw error for negative balance', () => {
      expect(() => Balance.create(-1)).toThrow('Balance must be a non-negative integer');
    });

    it('should throw error for non-integer cents', () => {
      expect(() => Balance.create(99.99)).toThrow('Balance must be a non-negative integer');
    });
  });

  describe('fromDollars', () => {
    it('should create Balance from dollar amount', () => {
      const balance = Balance.fromDollars(100.5);
      expect(balance.getCents()).toBe(10050);
      expect(balance.getDollars()).toBe(100.5);
    });

    it('should handle rounding correctly', () => {
      const balance = Balance.fromDollars(99.999);
      expect(balance.getCents()).toBe(10000); // Rounds to 100.00
    });
  });

  describe('add', () => {
    it('should add balance amounts', () => {
      const balance1 = Balance.create(10000); // $100
      const balance2 = Balance.create(5000); // $50
      const result = balance1.add(balance2);
      expect(result.getCents()).toBe(15000); // $150
    });

    it('should add zero balance', () => {
      const balance1 = Balance.create(10000);
      const balance2 = Balance.create(0);
      const result = balance1.add(balance2);
      expect(result.getCents()).toBe(10000);
    });

    it('should not mutate original balance', () => {
      const balance1 = Balance.create(10000);
      const balance2 = Balance.create(5000);
      balance1.add(balance2);
      expect(balance1.getCents()).toBe(10000);
    });
  });

  describe('subtract', () => {
    it('should subtract balance amounts', () => {
      const balance1 = Balance.create(10000); // $100
      const balance2 = Balance.create(3000); // $30
      const result = balance1.subtract(balance2);
      expect(result.getCents()).toBe(7000); // $70
    });

    it('should subtract zero balance', () => {
      const balance1 = Balance.create(10000);
      const balance2 = Balance.create(0);
      const result = balance1.subtract(balance2);
      expect(result.getCents()).toBe(10000);
    });

    it('should throw error when result would be negative', () => {
      const balance1 = Balance.create(5000); // $50
      const balance2 = Balance.create(10000); // $100
      expect(() => balance1.subtract(balance2)).toThrow('Insufficient balance');
    });

    it('should not mutate original balance', () => {
      const balance1 = Balance.create(10000);
      const balance2 = Balance.create(3000);
      balance1.subtract(balance2);
      expect(balance1.getCents()).toBe(10000);
    });
  });

  describe('isGreaterThanOrEqual', () => {
    it('should return true when balance is greater', () => {
      const balance1 = Balance.create(10000); // $100
      const balance2 = Balance.create(5000); // $50
      expect(balance1.isGreaterThanOrEqual(balance2)).toBe(true);
    });

    it('should return true when balance is equal', () => {
      const balance1 = Balance.create(10000);
      const balance2 = Balance.create(10000);
      expect(balance1.isGreaterThanOrEqual(balance2)).toBe(true);
    });

    it('should return false when balance is less', () => {
      const balance1 = Balance.create(5000); // $50
      const balance2 = Balance.create(10000); // $100
      expect(balance1.isGreaterThanOrEqual(balance2)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal balances', () => {
      const balance1 = Balance.create(10000);
      const balance2 = Balance.create(10000);
      expect(balance1.equals(balance2)).toBe(true);
    });

    it('should return false for different balances', () => {
      const balance1 = Balance.create(10000);
      const balance2 = Balance.create(5000);
      expect(balance1.equals(balance2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return formatted string with dollar sign', () => {
      const balance = Balance.create(10050); // $100.50
      expect(balance.toString()).toBe('$100.50');
    });

    it('should format zero balance correctly', () => {
      const balance = Balance.create(0);
      expect(balance.toString()).toBe('$0.00');
    });
  });
});
