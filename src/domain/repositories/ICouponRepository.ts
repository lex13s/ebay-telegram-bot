import { Coupon } from '../entities/Coupon';
import { CouponCode } from '../value-objects/CouponCode';
import { UserId } from '../value-objects/UserId';
import { Balance } from '../value-objects/Balance';

export interface ICouponRepository {
  findByCode(code: CouponCode): Promise<Coupon | null>;
  create(code: CouponCode, value: Balance): Promise<Coupon>;
  activate(code: CouponCode, userId: UserId): Promise<void>;
  save(coupon: Coupon): Promise<void>;
}
