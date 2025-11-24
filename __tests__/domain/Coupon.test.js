"use strict";
/**
 * Тесты для Entity: Coupon
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Coupon_1 = require("../../src/domain/entities/Coupon");
const CouponCode_1 = require("../../src/domain/value-objects/CouponCode");
const Balance_1 = require("../../src/domain/value-objects/Balance");
const UserId_1 = require("../../src/domain/value-objects/UserId");
describe('Domain Layer - Entity: Coupon', () => {
    describe('create', () => {
        it('should create a new inactive coupon', () => {
            const code = CouponCode_1.CouponCode.create('TEST-COUPON-123');
            const value = Balance_1.Balance.create(5000); // $50
            const coupon = Coupon_1.Coupon.create(code, value);
            expect(coupon.getCode().getValue()).toBe('TEST-COUPON-123');
            expect(coupon.getValue().getCents()).toBe(5000);
            expect(coupon.getIsActivated()).toBe(false);
            expect(coupon.getActivatedBy()).toBeNull();
            expect(coupon.getActivatedAt()).toBeNull();
        });
    });
    describe('createFromDb', () => {
        it('should create coupon from database with activation data', () => {
            const code = CouponCode_1.CouponCode.create('DB-COUPON-456');
            const value = Balance_1.Balance.create(10000); // $100
            const userId = UserId_1.UserId.create(123456);
            const activatedAt = new Date('2025-11-23T10:00:00Z');
            const coupon = Coupon_1.Coupon.createFromDb(code, value, true, userId, activatedAt);
            expect(coupon.getCode().getValue()).toBe('DB-COUPON-456');
            expect(coupon.getValue().getCents()).toBe(10000);
            expect(coupon.getIsActivated()).toBe(true);
            expect(coupon.getActivatedBy()?.getValue()).toBe(123456);
            expect(coupon.getActivatedAt()).toEqual(activatedAt);
        });
        it('should create inactive coupon from database', () => {
            const code = CouponCode_1.CouponCode.create('DB-INACTIVE');
            const value = Balance_1.Balance.create(2500); // $25
            const coupon = Coupon_1.Coupon.createFromDb(code, value, false, null, null);
            expect(coupon.getIsActivated()).toBe(false);
            expect(coupon.getActivatedBy()).toBeNull();
            expect(coupon.getActivatedAt()).toBeNull();
        });
    });
    describe('activate', () => {
        it('should activate an inactive coupon', () => {
            const coupon = Coupon_1.Coupon.create(CouponCode_1.CouponCode.create('ACTIVATE-ME'), Balance_1.Balance.create(5000));
            const userId = UserId_1.UserId.create(789);
            coupon.activate(userId);
            expect(coupon.getIsActivated()).toBe(true);
            expect(coupon.getActivatedBy()?.getValue()).toBe(789);
            expect(coupon.getActivatedAt()).toBeInstanceOf(Date);
        });
        it('should throw error when activating already activated coupon', () => {
            const coupon = Coupon_1.Coupon.create(CouponCode_1.CouponCode.create('ALREADY-ACTIVE'), Balance_1.Balance.create(5000));
            const userId = UserId_1.UserId.create(123);
            coupon.activate(userId);
            expect(() => coupon.activate(UserId_1.UserId.create(456))).toThrow('Coupon already activated');
        });
        it('should set activation timestamp to current time', () => {
            const coupon = Coupon_1.Coupon.create(CouponCode_1.CouponCode.create('TIME-CHECK'), Balance_1.Balance.create(5000));
            const userId = UserId_1.UserId.create(999);
            const beforeActivation = new Date();
            coupon.activate(userId);
            const activatedAt = coupon.getActivatedAt();
            const afterActivation = new Date();
            expect(activatedAt).not.toBeNull();
            expect(activatedAt.getTime()).toBeGreaterThanOrEqual(beforeActivation.getTime());
            expect(activatedAt.getTime()).toBeLessThanOrEqual(afterActivation.getTime());
        });
    });
    describe('canBeActivated', () => {
        it('should return true for inactive coupon', () => {
            const coupon = Coupon_1.Coupon.create(CouponCode_1.CouponCode.create('CAN-ACTIVATE'), Balance_1.Balance.create(5000));
            expect(coupon.canBeActivated()).toBe(true);
        });
        it('should return false for activated coupon', () => {
            const coupon = Coupon_1.Coupon.create(CouponCode_1.CouponCode.create('CANNOT-ACTIVATE'), Balance_1.Balance.create(5000));
            coupon.activate(UserId_1.UserId.create(123));
            expect(coupon.canBeActivated()).toBe(false);
        });
        it('should return false for coupon loaded from DB as activated', () => {
            const coupon = Coupon_1.Coupon.createFromDb(CouponCode_1.CouponCode.create('DB-ACTIVATED'), Balance_1.Balance.create(5000), true, UserId_1.UserId.create(456), new Date());
            expect(coupon.canBeActivated()).toBe(false);
        });
    });
});
