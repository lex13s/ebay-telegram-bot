import { UserId } from '../../domain/value-objects/UserId';
import { CouponCode } from '../../domain/value-objects/CouponCode';
import { Balance } from '../../domain/value-objects/Balance';
import { UserService } from '../services/UserService';
import { CouponService } from '../services/CouponService';
import { ILogger } from '../../infrastructure/logging/Logger';

export interface RedeemCouponRequest {
  userId: UserId;
  username: string | null;
  couponCode: CouponCode;
}

export interface RedeemCouponResponse {
  addedBalance: Balance;
  newBalance: Balance;
}

/**
 * Use case for redeeming coupon codes
 */
export class RedeemCouponUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly couponService: CouponService,
    private readonly logger: ILogger
  ) {}

  public async execute(request: RedeemCouponRequest): Promise<RedeemCouponResponse> {
    this.logger.info('Redeeming coupon', {
      userId: request.userId.getValue(),
      couponCode: request.couponCode.getValue(),
    });

    // Get or create user
    const user = await this.userService.getOrCreateUser(request.userId, request.username);

    // Redeem coupon
    const couponValue = await this.couponService.redeemCoupon(request.couponCode, request.userId);

    // Add balance to user
    user.addBalance(couponValue);
    await this.userService.saveUser(user);

    this.logger.info('Coupon redeemed successfully', {
      userId: request.userId.getValue(),
      addedBalance: couponValue.getCents(),
      newBalance: user.getBalance().getCents(),
    });

    return {
      addedBalance: couponValue,
      newBalance: user.getBalance(),
    };
  }
}

