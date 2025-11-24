/**
 * Value Object: UserId
 */

import { UserId } from '../../src/domain/value-objects/UserId';

describe('Domain Layer - Value Object: UserId', () => {
  describe('create', () => {
    it('should create UserId with valid positive integer', () => {
      const userId = UserId.create(123456);
      expect(userId.getValue()).toBe(123456);
    });

    it('should throw error for negative user ID', () => {
      expect(() => UserId.create(-1)).toThrow('UserId must be a positive integer');
    });

    it('should throw error for zero user ID', () => {
      expect(() => UserId.create(0)).toThrow('UserId must be a positive integer');
    });

    it('should throw error for non-integer user ID', () => {
      expect(() => UserId.create(123.45)).toThrow('UserId must be a positive integer');
    });
  });

  describe('equals', () => {
    it('should return true for equal user IDs', () => {
      const userId1 = UserId.create(123456);
      const userId2 = UserId.create(123456);
      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should return false for different user IDs', () => {
      const userId1 = UserId.create(123456);
      const userId2 = UserId.create(654321);
      expect(userId1.equals(userId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation of user ID', () => {
      const userId = UserId.create(123456);
      expect(userId.toString()).toBe('123456');
    });
  });
});
