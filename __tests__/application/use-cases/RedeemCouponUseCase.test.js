"use strict";
/**
 * Tests for RedeemCouponUseCase
 */
Object.defineProperty(exports, "__esModule", { value: true });
const RedeemCouponUseCase_1 = require("../../../src/application/use-cases/RedeemCouponUseCase");
const UserId_1 = require("../../../src/domain/value-objects/UserId");
const CouponCode_1 = require("../../../src/domain/value-objects/CouponCode");
const Balance_1 = require("../../../src/domain/value-objects/Balance");
const DomainErrors_1 = require("../../../src/domain/errors/DomainErrors");
const MockFactory_1 = require("../../helpers/MockFactory");
describe('Application Layer - Use Case: RedeemCouponUseCase', () => {
    let useCase;
    let mockUserService;
    let mockCouponService;
    let mockLogger;
    beforeEach(() => {
        // Setup mocks
        mockUserService = {
            getOrCreateUser: jest.fn(),
            saveUser: jest.fn(),
            getUserById: jest.fn(),
            addBalance: jest.fn(),
            deductBalance: jest.fn(),
            updateSearchConfig: jest.fn(),
        };
        mockCouponService = {
            generateCoupon: jest.fn(),
            redeemCoupon: jest.fn(),
            findByCode: jest.fn(),
            getAllUnused: jest.fn(),
        };
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
        useCase = new RedeemCouponUseCase_1.RedeemCouponUseCase(mockUserService, mockCouponService, mockLogger);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('execute - successful redemption', () => {
        it('should redeem coupon and add balance to user', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('ABCD-1234-EFGH');
            const user = MockFactory_1.MockFactory.createUser({
                id: 123456,
                username: 'testuser',
                balanceCents: 5000, // $50
            });
            const couponValue = Balance_1.Balance.fromDollars(25); // $25 coupon
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'testuser',
                couponCode,
            });
            // Assert
            expect(result.addedBalance.getCents()).toBe(2500); // $25
            expect(result.newBalance.getCents()).toBe(7500); // $50 + $25 = $75
            expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith(userId, 'testuser');
            expect(mockCouponService.redeemCoupon).toHaveBeenCalledWith(couponCode, userId);
            expect(mockUserService.saveUser).toHaveBeenCalledWith(user);
            expect(mockLogger.info).toHaveBeenCalledWith('Coupon redeemed successfully', expect.any(Object));
        });
        it('should create new user if not exists', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(999999);
            const couponCode = CouponCode_1.CouponCode.create('NEW-USER-CODE');
            const newUser = MockFactory_1.MockFactory.createUser({
                id: 999999,
                username: 'newuser',
                balanceCents: 1000, // $10 trial balance
            });
            const couponValue = Balance_1.Balance.fromDollars(50);
            mockUserService.getOrCreateUser.mockResolvedValue(newUser);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'newuser',
                couponCode,
            });
            // Assert
            expect(result.addedBalance.getCents()).toBe(5000); // $50
            expect(result.newBalance.getCents()).toBe(6000); // $10 + $50 = $60
            expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith(userId, 'newuser');
        });
        it('should handle redemption without username', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('ANON-COUPON');
            const user = MockFactory_1.MockFactory.createUser({
                id: 123456,
                username: null,
                balanceCents: 2000,
            });
            const couponValue = Balance_1.Balance.fromDollars(10);
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            const result = await useCase.execute({
                userId,
                username: null,
                couponCode,
            });
            // Assert
            expect(result.newBalance.getCents()).toBe(3000); // $20 + $10 = $30
            expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith(userId, null);
        });
        it('should handle redemption for user with zero balance', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('FIRST-COUPON');
            const user = MockFactory_1.MockFactory.createUser({
                id: 123456,
                balanceCents: 0, // $0 balance
            });
            const couponValue = Balance_1.Balance.fromDollars(100);
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'pooruser',
                couponCode,
            });
            // Assert
            expect(result.addedBalance.getCents()).toBe(10000); // $100
            expect(result.newBalance.getCents()).toBe(10000); // $0 + $100 = $100
        });
    });
    describe('execute - coupon not found', () => {
        it('should throw CouponNotFoundError when coupon does not exist', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('INVALID-CODE');
            const user = MockFactory_1.MockFactory.createUser({ id: 123456, balanceCents: 5000 });
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockCouponService.redeemCoupon.mockRejectedValue(new DomainErrors_1.CouponNotFoundError('INVALID-CODE'));
            // Act & Assert
            await expect(useCase.execute({
                userId,
                username: 'testuser',
                couponCode,
            })).rejects.toThrow(DomainErrors_1.CouponNotFoundError);
            // User should NOT be saved if coupon is invalid
            expect(mockUserService.saveUser).not.toHaveBeenCalled();
        });
    });
    describe('execute - coupon already used', () => {
        it('should throw InvalidCouponError when coupon is already redeemed', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('USED-COUPON');
            const user = MockFactory_1.MockFactory.createUser({ id: 123456, balanceCents: 5000 });
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockCouponService.redeemCoupon.mockRejectedValue(new DomainErrors_1.InvalidCouponError('Coupon already used'));
            // Act & Assert
            await expect(useCase.execute({
                userId,
                username: 'testuser',
                couponCode,
            })).rejects.toThrow(DomainErrors_1.InvalidCouponError);
            // User should NOT be saved if coupon is already used
            expect(mockUserService.saveUser).not.toHaveBeenCalled();
        });
    });
    describe('execute - different coupon values', () => {
        it('should handle small coupon value ($1)', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('SMALL-COUPON');
            const user = MockFactory_1.MockFactory.createUser({ id: 123456, balanceCents: 1000 });
            const couponValue = Balance_1.Balance.fromDollars(1);
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'testuser',
                couponCode,
            });
            // Assert
            expect(result.addedBalance.getCents()).toBe(100); // $1
            expect(result.newBalance.getCents()).toBe(1100); // $10 + $1 = $11
        });
        it('should handle large coupon value ($500)', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('BIG-COUPON');
            const user = MockFactory_1.MockFactory.createUser({ id: 123456, balanceCents: 1000 });
            const couponValue = Balance_1.Balance.fromDollars(500);
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'luckyuser',
                couponCode,
            });
            // Assert
            expect(result.addedBalance.getCents()).toBe(50000); // $500
            expect(result.newBalance.getCents()).toBe(51000); // $10 + $500 = $510
        });
        it('should handle coupon with cents ($25.50)', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('CENTS-COUPON');
            const user = MockFactory_1.MockFactory.createUser({ id: 123456, balanceCents: 5000 });
            const couponValue = Balance_1.Balance.fromDollars(25.5);
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'testuser',
                couponCode,
            });
            // Assert
            expect(result.addedBalance.getCents()).toBe(2550); // $25.50
            expect(result.newBalance.getCents()).toBe(7550); // $50 + $25.50 = $75.50
        });
    });
    describe('execute - logging', () => {
        it('should log info at start of redemption', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('LOG-TEST');
            const user = MockFactory_1.MockFactory.createUser({ id: 123456, balanceCents: 5000 });
            const couponValue = Balance_1.Balance.fromDollars(25);
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            await useCase.execute({
                userId,
                username: 'testuser',
                couponCode,
            });
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith('Redeeming coupon', {
                userId: 123456,
                couponCode: 'LOG-TEST',
            });
        });
        it('should log success after redemption', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('SUCCESS-LOG');
            const user = MockFactory_1.MockFactory.createUser({ id: 123456, balanceCents: 5000 });
            const couponValue = Balance_1.Balance.fromDollars(50);
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            await useCase.execute({
                userId,
                username: 'testuser',
                couponCode,
            });
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith('Coupon redeemed successfully', {
                userId: 123456,
                addedBalance: 5000,
                newBalance: 10000,
            });
        });
    });
    describe('execute - edge cases', () => {
        it('should not save user if coupon service throws error', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('ERROR-COUPON');
            const user = MockFactory_1.MockFactory.createUser({ id: 123456, balanceCents: 5000 });
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockCouponService.redeemCoupon.mockRejectedValue(new Error('Database error'));
            // Act & Assert
            await expect(useCase.execute({
                userId,
                username: 'testuser',
                couponCode,
            })).rejects.toThrow('Database error');
            // User should NOT be saved if any error occurs
            expect(mockUserService.saveUser).not.toHaveBeenCalled();
        });
        it('should maintain user balance integrity', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const couponCode = CouponCode_1.CouponCode.create('INTEGRITY-TEST');
            const originalBalance = 7500; // $75
            const user = MockFactory_1.MockFactory.createUser({ id: 123456, balanceCents: originalBalance });
            const couponValue = Balance_1.Balance.fromDollars(25);
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockCouponService.redeemCoupon.mockResolvedValue(couponValue);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'testuser',
                couponCode,
            });
            // Assert
            expect(result.newBalance.getCents()).toBe(originalBalance + couponValue.getCents());
            expect(result.addedBalance.getCents()).toBe(couponValue.getCents());
        });
    });
});
