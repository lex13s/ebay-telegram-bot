/**
 * CouponService
 */

import { CouponService } from '../../../src/application';
import { Balance } from '../../../src/domain';
import { CouponCode } from '../../../src/domain';
import { UserId } from '../../../src/domain';
import { InvalidCouponError, CouponNotFoundError } from '../../../src/domain';
import { ILogger } from '../../../src/infrastructure';
import { MockCouponRepository, MockFactory } from '../../helpers';

describe('Application Layer - Service: CouponService', () => {
  let couponService: CouponService;
  let mockCouponRepository: MockCouponRepository;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockCouponRepository = new MockCouponRepository();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    couponService = new CouponService(mockCouponRepository, mockLogger);
  });

  afterEach(() => {
    mockCouponRepository.clear();
    jest.clearAllMocks();
  });

  describe('generateCoupon', () => {
    it('should generate coupon with valid value', async () => {
      const value = Balance.fromDollars(50);
      const coupon = await couponService.generateCoupon(value);

      expect(coupon).toBeDefined();
      expect(coupon.getValue().getCents()).toBe(5000);
      expect(coupon.getIsActivated()).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('Generating new coupon', expect.any(Object));
    });

    it('should generate unique codes', async () => {
      const value = Balance.fromDollars(25);
      const coupon1 = await couponService.generateCoupon(value);
      const coupon2 = await couponService.generateCoupon(value);
      const coupon3 = await couponService.generateCoupon(value);

      expect(coupon1.getCode().getValue()).not.toBe(coupon2.getCode().getValue());
      expect(coupon2.getCode().getValue()).not.toBe(coupon3.getCode().getValue());
      expect(coupon1.getCode().getValue()).not.toBe(coupon3.getCode().getValue());
    });

    it('should save coupon to repository', async () => {
      const value = Balance.fromDollars(100);
      const coupon = await couponService.generateCoupon(value);

      const savedCoupon = await mockCouponRepository.findByCode(coupon.getCode());
      expect(savedCoupon).toBeDefined();
      expect(savedCoupon!.getValue().getCents()).toBe(10000);
    });

    it('should handle small values ($1)', async () => {
      const value = Balance.fromDollars(1);
      const coupon = await couponService.generateCoupon(value);
      expect(coupon.getValue().getCents()).toBe(100);
    });

    it('should handle large values ($1000)', async () => {
      const value = Balance.fromDollars(1000);
      const coupon = await couponService.generateCoupon(value);
      expect(coupon.getValue().getCents()).toBe(100000);
    });
  });

  describe('redeemCoupon', () => {
    it('should redeem valid unactivated coupon', async () => {
      const code = CouponCode.generate();
      const value = Balance.fromDollars(50);
      const userId = UserId.create(123456);

      await mockCouponRepository.create(code, value);

      const redeemedValue = await couponService.redeemCoupon(code, userId);

      expect(redeemedValue.getCents()).toBe(5000);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Coupon redeemed successfully',
        expect.any(Object)
      );
    });

    it('should mark coupon as activated after redemption', async () => {
      const code = CouponCode.generate();
      const value = Balance.fromDollars(25);
      const userId = UserId.create(123456);

      await mockCouponRepository.create(code, value);
      await couponService.redeemCoupon(code, userId);

      const coupon = await mockCouponRepository.findByCode(code);
      expect(coupon!.getIsActivated()).toBe(true);
      expect(coupon!.getActivatedBy()?.getValue()).toBe(123456);
      expect(coupon!.getActivatedAt()).toBeInstanceOf(Date);
    });

    it('should throw CouponNotFoundError for non-existent coupon', async () => {
      const code = CouponCode.create('INVALID-CODE');
      const userId = UserId.create(123456);

      await expect(couponService.redeemCoupon(code, userId)).rejects.toThrow(CouponNotFoundError);
      await expect(couponService.redeemCoupon(code, userId)).rejects.toThrow(
        'Coupon not found: INVALID-CODE'
      );
    });

    it('should throw InvalidCouponError for already activated coupon', async () => {
      const code = CouponCode.generate();
      const value = Balance.fromDollars(50);
      const userId1 = UserId.create(111);
      const userId2 = UserId.create(222);

      await mockCouponRepository.create(code, value);
      await couponService.redeemCoupon(code, userId1);

      await expect(couponService.redeemCoupon(code, userId2)).rejects.toThrow(InvalidCouponError);
      await expect(couponService.redeemCoupon(code, userId2)).rejects.toThrow(
        'Coupon already activated'
      );
    });

    it('should handle redemption by different users', async () => {
      const code1 = CouponCode.generate();
      const code2 = CouponCode.generate();
      const value = Balance.fromDollars(25);
      const user1 = UserId.create(111);
      const user2 = UserId.create(222);

      await mockCouponRepository.create(code1, value);
      await mockCouponRepository.create(code2, value);

      const value1 = await couponService.redeemCoupon(code1, user1);
      const value2 = await couponService.redeemCoupon(code2, user2);

      expect(value1.getCents()).toBe(2500);
      expect(value2.getCents()).toBe(2500);

      const coupon1 = await mockCouponRepository.findByCode(code1);
      const coupon2 = await mockCouponRepository.findByCode(code2);

      expect(coupon1!.getActivatedBy()?.getValue()).toBe(111);
      expect(coupon2!.getActivatedBy()?.getValue()).toBe(222);
    });
  });

  describe('integration scenarios', () => {
    it('should handle full coupon lifecycle', async () => {
      const value = Balance.fromDollars(100);
      const userId = UserId.create(123456);

      const coupon = await couponService.generateCoupon(value);
      expect(coupon.getIsActivated()).toBe(false);

      const redeemedValue = await couponService.redeemCoupon(coupon.getCode(), userId);
      expect(redeemedValue.getCents()).toBe(10000);

      const activatedCoupon = await mockCouponRepository.findByCode(coupon.getCode());
      expect(activatedCoupon!.getIsActivated()).toBe(true);
      expect(activatedCoupon!.getActivatedBy()?.getValue()).toBe(123456);
    });

    it('should handle multiple coupons generation and redemption', async () => {
      const coupons = await Promise.all([
        couponService.generateCoupon(Balance.fromDollars(10)),
        couponService.generateCoupon(Balance.fromDollars(20)),
        couponService.generateCoupon(Balance.fromDollars(30)),
      ]);

      expect(coupons).toHaveLength(3);
      expect(mockCouponRepository.getAll()).toHaveLength(3);

      await couponService.redeemCoupon(coupons[0].getCode(), UserId.create(111));
      await couponService.redeemCoupon(coupons[1].getCode(), UserId.create(222));

      expect(mockCouponRepository.getAllUnactivated()).toHaveLength(1);
    });
  });

  describe('logging', () => {
    it('should log coupon generation', async () => {
      const value = Balance.fromDollars(50);
      const coupon = await couponService.generateCoupon(value);

      expect(mockLogger.info).toHaveBeenCalledWith('Generating new coupon', {
        code: coupon.getCode().getValue(),
        value: 5000,
      });
    });

    it('should log coupon redemption', async () => {
      const code = CouponCode.generate();
      const value = Balance.fromDollars(25);
      const userId = UserId.create(123456);

      await mockCouponRepository.create(code, value);
      await couponService.redeemCoupon(code, userId);

      expect(mockLogger.info).toHaveBeenCalledWith('Redeeming coupon', {
        code: code.getValue(),
        userId: 123456,
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Coupon redeemed successfully', {
        code: code.getValue(),
        userId: 123456,
        value: 2500,
      });
    });
  });

  describe('error handling', () => {
    it('should not activate coupon if save fails', async () => {
      const code = CouponCode.generate();
      const value = Balance.fromDollars(50);
      const userId = UserId.create(123456);

      await mockCouponRepository.create(code, value);

      const errorRepo = {
        findByCode: jest
          .fn()
          .mockResolvedValue(MockFactory.createCoupon({ code: code.getValue() })),
        save: jest.fn().mockRejectedValue(new Error('Database error')),
        create: jest.fn(),
        activate: jest.fn(),
      } as any;

      const errorService = new CouponService(errorRepo, mockLogger);

      await expect(errorService.redeemCoupon(code, userId)).rejects.toThrow('Database error');
    });
  });
});
