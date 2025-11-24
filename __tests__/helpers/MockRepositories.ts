/**
 * Mock Repository для тестов
 */

import { IUserRepository } from '../../src/domain/repositories/IUserRepository';
import { ICouponRepository } from '../../src/domain/repositories/ICouponRepository';
import { User } from '../../src/domain/entities/User';
import { Coupon } from '../../src/domain/entities/Coupon';
import { UserId } from '../../src/domain/value-objects/UserId';
import { Balance } from '../../src/domain/value-objects/Balance';
import { SearchConfigKey } from '../../src/domain/value-objects/SearchConfigKey';
import { CouponCode } from '../../src/domain/value-objects/CouponCode';

/**
 * Mock User Repository для изоляции тестов
 */
export class MockUserRepository implements IUserRepository {
  private users: Map<number, User> = new Map();

  async findById(userId: UserId): Promise<User | null> {
    return this.users.get(userId.getValue()) || null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.getUserId().getValue(), user);
  }

  async createNew(userId: UserId, username: string | null, trialBalance: Balance): Promise<User> {
    const user = User.createNew(userId, username, trialBalance);
    await this.save(user);
    return user;
  }

  async getOrCreate(userId: UserId, username: string | null, trialBalance: Balance): Promise<User> {
    const existingUser = await this.findById(userId);
    if (existingUser) {
      return existingUser;
    }
    return this.createNew(userId, username, trialBalance);
  }

  async updateBalance(userId: UserId, newBalance: Balance): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId.getValue()}`);
    }

    // Calculate difference and update
    const currentBalance = user.getBalance();
    const difference = newBalance.getCents() - currentBalance.getCents();

    if (difference > 0) {
      user.addBalance(Balance.create(difference));
    } else if (difference < 0) {
      user.deductBalance(Balance.create(Math.abs(difference)));
    }

    await this.save(user);
  }

  async updateSearchConfig(userId: UserId, configKey: SearchConfigKey): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId.getValue()}`);
    }

    user.updateSearchConfig(configKey);
    await this.save(user);
  }

  async exists(userId: UserId): Promise<boolean> {
    return this.users.has(userId.getValue());
  }

  // Вспомогательные методы для тестов
  clear(): void {
    this.users.clear();
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }
}

/**
 * Mock Coupon Repository для изоляции тестов
 */
export class MockCouponRepository implements ICouponRepository {
  private coupons: Map<string, Coupon> = new Map();

  async findByCode(code: CouponCode): Promise<Coupon | null> {
    return this.coupons.get(code.getValue()) || null;
  }

  async create(code: CouponCode, value: Balance): Promise<Coupon> {
    const coupon = Coupon.create(code, value);
    this.coupons.set(code.getValue(), coupon);
    return coupon;
  }

  async activate(code: CouponCode, userId: UserId): Promise<void> {
    const coupon = await this.findByCode(code);
    if (!coupon) {
      throw new Error(`Coupon not found: ${code.getValue()}`);
    }
    coupon.activate(userId);
    this.coupons.set(code.getValue(), coupon);
  }

  async save(coupon: Coupon): Promise<void> {
    this.coupons.set(coupon.getCode().getValue(), coupon);
  }

  // Вспомогательные методы для тестов
  clear(): void {
    this.coupons.clear();
  }

  getAll(): Coupon[] {
    return Array.from(this.coupons.values());
  }

  getAllUnactivated(): Coupon[] {
    return Array.from(this.coupons.values()).filter((c) => !c.getIsActivated());
  }
}
