import { Balance } from '../../domain/value-objects/Balance';
import { CouponCode } from '../../domain/value-objects/CouponCode';
import { CouponService } from '../services/CouponService';
import { ILogger } from '../../infrastructure/logging/Logger';

export interface GenerateCouponRequest {
  valueInDollars: number;
}

export interface GenerateCouponResponse {
  code: CouponCode;
  value: Balance;
}

/**
 * Use case for generating coupon codes (admin only)
 */
export class GenerateCouponUseCase {
  constructor(
    private readonly couponService: CouponService,
    private readonly logger: ILogger
  ) {}

  public async execute(request: GenerateCouponRequest): Promise<GenerateCouponResponse> {
    this.logger.info('Generating coupon', { valueInDollars: request.valueInDollars });

    if (request.valueInDollars <= 0) {
      throw new Error('Coupon value must be positive');
    }

    const value = Balance.fromDollars(request.valueInDollars);
    const coupon = await this.couponService.generateCoupon(value);

    this.logger.info('Coupon generated', {
      code: coupon.getCode().getValue(),
      value: value.getCents(),
    });

    return {
      code: coupon.getCode(),
      value: value,
    };
  }
}

