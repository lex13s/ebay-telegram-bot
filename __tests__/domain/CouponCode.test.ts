/**
 * Tests for Value Object: CouponCode
 */

import { CouponCode } from '../../src/domain/value-objects/CouponCode';

describe('Domain Layer - Value Object: CouponCode', () => {
  describe('generate', () => {
    it('should generate a valid coupon code with C- prefix', () => {
      const couponCode = CouponCode.generate();
      expect(couponCode.getValue()).toMatch(/^C-[A-F0-9]{8}$/);
    });

    it('should generate unique coupon codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const couponCode = CouponCode.generate();
        codes.add(couponCode.getValue());
      }
      // All 100 codes should be unique
      expect(codes.size).toBe(100);
    });

    it('should generate codes with correct format (C-HEX)', () => {
      const couponCode = CouponCode.generate();
      const value = couponCode.getValue();
      expect(value).toMatch(/^C-[A-F0-9]{8}$/);
      expect(value.startsWith('C-')).toBe(true);
      expect(value.length).toBe(10); // C- + 8 hex chars
    });
  });

  describe('create', () => {
    it('should create CouponCode with any valid string', () => {
      const couponCode = CouponCode.create('ABCD-1234-EFGH');
      expect(couponCode.getValue()).toBe('ABCD-1234-EFGH');
    });

    it('should convert lowercase to uppercase', () => {
      const couponCode = CouponCode.create('abcd-1234-efgh');
      expect(couponCode.getValue()).toBe('ABCD-1234-EFGH');
    });

    it('should accept generated format', () => {
      const couponCode = CouponCode.create('C-ABC12345');
      expect(couponCode.getValue()).toBe('C-ABC12345');
    });

    it('should trim whitespace', () => {
      const couponCode = CouponCode.create('  TEST-CODE  ');
      expect(couponCode.getValue()).toBe('TEST-CODE');
    });

    it('should throw error for empty string', () => {
      expect(() => CouponCode.create('')).toThrow('CouponCode cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => CouponCode.create('   ')).toThrow('CouponCode cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for equal coupon codes', () => {
      const code1 = CouponCode.create('ABCD-1234-EFGH');
      const code2 = CouponCode.create('ABCD-1234-EFGH');
      expect(code1.equals(code2)).toBe(true);
    });

    it('should return false for different coupon codes', () => {
      const code1 = CouponCode.create('ABCD-1234-EFGH');
      const code2 = CouponCode.create('WXYZ-5678-IJKL');
      expect(code1.equals(code2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation of coupon code', () => {
      const couponCode = CouponCode.create('ABCD-1234-EFGH');
      expect(couponCode.toString()).toBe('ABCD-1234-EFGH');
    });
  });
});
