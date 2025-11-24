"use strict";
/**
 * Mock Repository для тестов
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockCouponRepository = exports.MockUserRepository = void 0;
const User_1 = require("../../src/domain/entities/User");
const Coupon_1 = require("../../src/domain/entities/Coupon");
const Balance_1 = require("../../src/domain/value-objects/Balance");
/**
 * Mock User Repository для изоляции тестов
 */
class MockUserRepository {
    constructor() {
        this.users = new Map();
    }
    async findById(userId) {
        return this.users.get(userId.getValue()) || null;
    }
    async save(user) {
        this.users.set(user.getUserId().getValue(), user);
    }
    async createNew(userId, username, trialBalance) {
        const user = User_1.User.createNew(userId, username, trialBalance);
        await this.save(user);
        return user;
    }
    async getOrCreate(userId, username, trialBalance) {
        const existingUser = await this.findById(userId);
        if (existingUser) {
            return existingUser;
        }
        return this.createNew(userId, username, trialBalance);
    }
    async updateBalance(userId, newBalance) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error(`User not found: ${userId.getValue()}`);
        }
        // Calculate difference and update
        const currentBalance = user.getBalance();
        const difference = newBalance.getCents() - currentBalance.getCents();
        if (difference > 0) {
            user.addBalance(Balance_1.Balance.create(difference));
        }
        else if (difference < 0) {
            user.deductBalance(Balance_1.Balance.create(Math.abs(difference)));
        }
        await this.save(user);
    }
    async updateSearchConfig(userId, configKey) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error(`User not found: ${userId.getValue()}`);
        }
        user.updateSearchConfig(configKey);
        await this.save(user);
    }
    async exists(userId) {
        return this.users.has(userId.getValue());
    }
    // Вспомогательные методы для тестов
    clear() {
        this.users.clear();
    }
    getAll() {
        return Array.from(this.users.values());
    }
}
exports.MockUserRepository = MockUserRepository;
/**
 * Mock Coupon Repository для изоляции тестов
 */
class MockCouponRepository {
    constructor() {
        this.coupons = new Map();
    }
    async findByCode(code) {
        return this.coupons.get(code.getValue()) || null;
    }
    async create(code, value) {
        const coupon = Coupon_1.Coupon.create(code, value);
        this.coupons.set(code.getValue(), coupon);
        return coupon;
    }
    async activate(code, userId) {
        const coupon = await this.findByCode(code);
        if (!coupon) {
            throw new Error(`Coupon not found: ${code.getValue()}`);
        }
        coupon.activate(userId);
        this.coupons.set(code.getValue(), coupon);
    }
    async save(coupon) {
        this.coupons.set(coupon.getCode().getValue(), coupon);
    }
    // Вспомогательные методы для тестов
    clear() {
        this.coupons.clear();
    }
    getAll() {
        return Array.from(this.coupons.values());
    }
    getAllUnactivated() {
        return Array.from(this.coupons.values()).filter((c) => !c.getIsActivated());
    }
}
exports.MockCouponRepository = MockCouponRepository;
