import { CouponCode } from '../value-objects/CouponCode';
import { Balance } from '../value-objects/Balance';
import { UserId } from '../value-objects/UserId';

export class Coupon {
  private constructor(
    private readonly code: CouponCode,
    private readonly value: Balance,
    private isActivated: boolean,
    private activatedBy: UserId | null,
    private activatedAt: Date | null
  ) {}

  public static create(code: CouponCode, value: Balance): Coupon {
    return new Coupon(code, value, false, null, null);
  }

  public static createFromDb(
    code: CouponCode,
    value: Balance,
    isActivated: boolean,
    activatedBy: UserId | null,
    activatedAt: Date | null
  ): Coupon {
    return new Coupon(code, value, isActivated, activatedBy, activatedAt);
  }

  public getCode(): CouponCode {
    return this.code;
  }

  public getValue(): Balance {
    return this.value;
  }

  public getIsActivated(): boolean {
    return this.isActivated;
  }

  public getActivatedBy(): UserId | null {
    return this.activatedBy;
  }

  public getActivatedAt(): Date | null {
    return this.activatedAt;
  }

  public activate(userId: UserId): void {
    if (this.isActivated) {
      throw new Error('Coupon already activated');
    }
    this.isActivated = true;
    this.activatedBy = userId;
    this.activatedAt = new Date();
  }

  public canBeActivated(): boolean {
    return !this.isActivated;
  }
}
