import { ICouponRepository } from '../../domain/repositories/ICouponRepository';
import { Coupon } from '../../domain/entities/Coupon';
import { CouponCode } from '../../domain/value-objects/CouponCode';
import { Balance } from '../../domain/value-objects/Balance';
import { UserId } from '../../domain/value-objects/UserId';
import { InvalidCouponError, CouponNotFoundError } from '../../domain/errors/DomainErrors';
import { ILogger } from '../../infrastructure/logging/Logger';

/**
 * Service for managing coupons
 */
export class CouponService {
  constructor(
    private readonly couponRepository: ICouponRepository,
    private readonly logger: ILogger
  ) {}

  public async generateCoupon(value: Balance): Promise<Coupon> {
    const code = CouponCode.generate();

    this.logger.info('Generating new coupon', {
      code: code.getValue(),
      value: value.getCents()
    });

    const coupon = await this.couponRepository.create(code, value);

    return coupon;
  }

  public async redeemCoupon(code: CouponCode, userId: UserId): Promise<Balance> {
    this.logger.info('Redeeming coupon', {
      code: code.getValue(),
      userId: userId.getValue()
    });

    const coupon = await this.couponRepository.findByCode(code);

    if (!coupon) {
      throw new CouponNotFoundError(code.getValue());
    }

    if (!coupon.canBeActivated()) {
      throw new InvalidCouponError('Coupon already activated');
    }

    coupon.activate(userId);
    await this.couponRepository.save(coupon);

    this.logger.info('Coupon redeemed successfully', {
      code: code.getValue(),
      userId: userId.getValue(),
      value: coupon.getValue().getCents()
    });

    return coupon.getValue();
  }
}

