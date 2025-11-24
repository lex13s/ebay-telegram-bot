/**
 * Tests for GenerateCouponUseCase
 */

import { GenerateCouponUseCase } from '../../../src/application/use-cases/GenerateCouponUseCase';
import { CouponService } from '../../../src/application/services/CouponService';
import { Balance } from '../../../src/domain/value-objects/Balance';
import { CouponCode } from '../../../src/domain/value-objects/CouponCode';
import { ILogger } from '../../../src/infrastructure/logging/Logger';
import { MockFactory } from '../../helpers/MockFactory';

describe('Application Layer - Use Case: GenerateCouponUseCase', () => {
  let useCase: GenerateCouponUseCase;
  let mockCouponService: jest.Mocked<CouponService>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    // Setup mocks
    mockCouponService = {
      generateCoupon: jest.fn(),
      redeemCoupon: jest.fn(),
      findByCode: jest.fn(),
      getAllUnused: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    useCase = new GenerateCouponUseCase(mockCouponService, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - successful generation', () => {
    it('should generate coupon with valid value', async () => {
      // Arrange
      const valueInDollars = 50;
      const mockCoupon = MockFactory.createCoupon({
        code: 'ABCD-1234-EFGH',
        valueCents: 5000,
      });

      mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

      // Act
      const result = await useCase.execute({ valueInDollars });

      // Assert
      expect(result.code.getValue()).toBe('ABCD-1234-EFGH');
      expect(result.value.getCents()).toBe(5000);
      expect(result.value.getDollars()).toBe(50);

      expect(mockCouponService.generateCoupon).toHaveBeenCalledWith(
        expect.objectContaining({
          getCents: expect.any(Function),
        })
      );

      const balanceArg = mockCouponService.generateCoupon.mock.calls[0][0] as Balance;
      expect(balanceArg.getCents()).toBe(5000);
    });

    it('should generate coupon with small value ($1)', async () => {
      // Arrange
      const valueInDollars = 1;
      const mockCoupon = MockFactory.createCoupon({
        code: 'SMALL-CODE',
        valueCents: 100,
      });

      mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

      // Act
      const result = await useCase.execute({ valueInDollars });

      // Assert
      expect(result.value.getCents()).toBe(100);
      expect(result.value.getDollars()).toBe(1);
    });

    it('should generate coupon with large value ($1000)', async () => {
      // Arrange
      const valueInDollars = 1000;
      const mockCoupon = MockFactory.createCoupon({
        code: 'BIG-COUPON-XYZ',
        valueCents: 100000,
      });

      mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

      // Act
      const result = await useCase.execute({ valueInDollars });

      // Assert
      expect(result.value.getCents()).toBe(100000);
      expect(result.value.getDollars()).toBe(1000);
    });

    it('should generate coupon with decimal value ($25.50)', async () => {
      // Arrange
      const valueInDollars = 25.5;
      const mockCoupon = MockFactory.createCoupon({
        code: 'DECIMAL-CODE',
        valueCents: 2550,
      });

      mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

      // Act
      const result = await useCase.execute({ valueInDollars });

      // Assert
      expect(result.value.getCents()).toBe(2550);
      expect(result.value.getDollars()).toBe(25.5);
    });
  });

  describe('execute - validation', () => {
    it('should throw error for zero value', async () => {
      // Arrange
      const valueInDollars = 0;

      // Act & Assert
      await expect(useCase.execute({ valueInDollars })).rejects.toThrow(
        'Coupon value must be positive'
      );

      expect(mockCouponService.generateCoupon).not.toHaveBeenCalled();
    });

    it('should throw error for negative value', async () => {
      // Arrange
      const valueInDollars = -50;

      // Act & Assert
      await expect(useCase.execute({ valueInDollars })).rejects.toThrow(
        'Coupon value must be positive'
      );

      expect(mockCouponService.generateCoupon).not.toHaveBeenCalled();
    });

    it('should throw error for very small negative value', async () => {
      // Arrange
      const valueInDollars = -0.01;

      // Act & Assert
      await expect(useCase.execute({ valueInDollars })).rejects.toThrow(
        'Coupon value must be positive'
      );
    });
  });

  describe('execute - coupon code uniqueness', () => {
    it('should generate different codes for multiple coupons', async () => {
      // Arrange
      const mockCoupon1 = MockFactory.createCoupon({
        code: 'CODE-0001',
        valueCents: 5000,
      });
      const mockCoupon2 = MockFactory.createCoupon({
        code: 'CODE-0002',
        valueCents: 5000,
      });
      const mockCoupon3 = MockFactory.createCoupon({
        code: 'CODE-0003',
        valueCents: 5000,
      });

      mockCouponService.generateCoupon
        .mockResolvedValueOnce(mockCoupon1)
        .mockResolvedValueOnce(mockCoupon2)
        .mockResolvedValueOnce(mockCoupon3);

      // Act
      const result1 = await useCase.execute({ valueInDollars: 50 });
      const result2 = await useCase.execute({ valueInDollars: 50 });
      const result3 = await useCase.execute({ valueInDollars: 50 });

      // Assert
      expect(result1.code.getValue()).toBe('CODE-0001');
      expect(result2.code.getValue()).toBe('CODE-0002');
      expect(result3.code.getValue()).toBe('CODE-0003');

      // All codes should be unique
      const codes = [result1.code.getValue(), result2.code.getValue(), result3.code.getValue()];
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(3);
    });
  });

  describe('execute - different value amounts', () => {
    it('should handle standard values ($5, $10, $25, $50, $100)', async () => {
      // Arrange
      const standardValues = [5, 10, 25, 50, 100];

      for (const value of standardValues) {
        const mockCoupon = MockFactory.createCoupon({
          code: `CODE-${value}`,
          valueCents: value * 100,
        });

        mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

        // Act
        const result = await useCase.execute({ valueInDollars: value });

        // Assert
        expect(result.value.getDollars()).toBe(value);
        expect(result.value.getCents()).toBe(value * 100);
      }
    });

    it('should handle fractional dollar amounts', async () => {
      // Arrange
      const fractionalValues = [0.5, 1.99, 9.95, 12.34, 99.99];

      for (const value of fractionalValues) {
        const mockCoupon = MockFactory.createCoupon({
          code: `FRAC-CODE`,
          valueCents: Math.round(value * 100),
        });

        mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

        // Act
        const result = await useCase.execute({ valueInDollars: value });

        // Assert
        expect(result.value.getDollars()).toBe(value);
      }
    });
  });

  describe('execute - logging', () => {
    it('should log info before generating', async () => {
      // Arrange
      const valueInDollars = 25;
      const mockCoupon = MockFactory.createCoupon({
        code: 'LOG-TEST',
        valueCents: 2500,
      });

      mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

      // Act
      await useCase.execute({ valueInDollars });

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Generating coupon', {
        valueInDollars: 25,
      });
    });

    it('should log success after generating', async () => {
      // Arrange
      const valueInDollars = 50;
      const mockCoupon = MockFactory.createCoupon({
        code: 'SUCCESS-CODE',
        valueCents: 5000,
      });

      mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

      // Act
      await useCase.execute({ valueInDollars });

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Coupon generated', {
        code: 'SUCCESS-CODE',
        value: 5000,
      });
    });

    it('should not log success if generation fails', async () => {
      // Arrange
      const valueInDollars = 50;
      mockCouponService.generateCoupon.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute({ valueInDollars })).rejects.toThrow('Database error');

      // Should log "Generating" but not "generated"
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Generating coupon', expect.any(Object));
    });
  });

  describe('execute - error handling', () => {
    it('should propagate error from coupon service', async () => {
      // Arrange
      const valueInDollars = 50;
      mockCouponService.generateCoupon.mockRejectedValue(new Error('Repository failure'));

      // Act & Assert
      await expect(useCase.execute({ valueInDollars })).rejects.toThrow('Repository failure');
    });

    it('should propagate unique constraint error', async () => {
      // Arrange
      const valueInDollars = 50;
      mockCouponService.generateCoupon.mockRejectedValue(
        new Error('UNIQUE constraint failed: coupons.code')
      );

      // Act & Assert
      await expect(useCase.execute({ valueInDollars })).rejects.toThrow('UNIQUE constraint failed');
    });
  });

  describe('execute - edge cases', () => {
    it('should handle very large coupon value', async () => {
      // Arrange
      const valueInDollars = 999999.99;
      const mockCoupon = MockFactory.createCoupon({
        code: 'HUGE-COUPON',
        valueCents: 99999999,
      });

      mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

      // Act
      const result = await useCase.execute({ valueInDollars });

      // Assert
      expect(result.value.getCents()).toBe(99999999);
    });

    it('should handle very small positive value ($0.01)', async () => {
      // Arrange
      const valueInDollars = 0.01;
      const mockCoupon = MockFactory.createCoupon({
        code: 'TINY-COUPON',
        valueCents: 1,
      });

      mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

      // Act
      const result = await useCase.execute({ valueInDollars });

      // Assert
      expect(result.value.getCents()).toBe(1);
      expect(result.value.getDollars()).toBe(0.01);
    });
  });

  describe('execute - return value structure', () => {
    it('should return object with code and value', async () => {
      // Arrange
      const valueInDollars = 50;
      const mockCoupon = MockFactory.createCoupon({
        code: 'STRUCT-TEST',
        valueCents: 5000,
      });

      mockCouponService.generateCoupon.mockResolvedValue(mockCoupon);

      // Act
      const result = await useCase.execute({ valueInDollars });

      // Assert
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('value');
      expect(result.code).toBeInstanceOf(CouponCode);
      expect(result.value).toBeInstanceOf(Balance);
    });
  });
});
