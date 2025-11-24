import { ICouponRepository } from '../../domain';
import { Coupon } from '../../domain';
import { CouponCode } from '../../domain';
import { UserId } from '../../domain';
import { Balance } from '../../domain';
import { DatabaseConnection } from './DatabaseConnection';
import { ILogger } from '../logging';

interface CouponRow {
  code: string;
  value_cents: number;
  is_activated: number; // SQLite stores boolean as 0 or 1
  activated_by_user_id: number | null;
  activated_at: string | null;
}

/**
 * SQLite implementation of ICouponRepository
 */
export class SqliteCouponRepository implements ICouponRepository {
  constructor(
    private readonly db: DatabaseConnection,
    private readonly logger: ILogger
  ) {}

  private mapRowToEntity(row: CouponRow): Coupon {
    return Coupon.createFromDb(
      CouponCode.create(row.code),
      Balance.create(row.value_cents),
      row.is_activated === 1,
      row.activated_by_user_id ? UserId.create(row.activated_by_user_id) : null,
      row.activated_at ? new Date(row.activated_at) : null
    );
  }

  public async findByCode(code: CouponCode): Promise<Coupon | null> {
    try {
      const row = await this.db.get<CouponRow>('SELECT * FROM coupons WHERE code = ?', [
        code.getValue(),
      ]);

      if (!row) return null;

      return this.mapRowToEntity(row);
    } catch (error) {
      this.logger.error('Failed to find coupon by code', error as Error, { code: code.getValue() });
      throw error;
    }
  }

  public async create(code: CouponCode, value: Balance): Promise<Coupon> {
    try {
      await this.db.run('INSERT INTO coupons (code, value_cents, is_activated) VALUES (?, ?, 0)', [
        code.getValue(),
        value.getCents(),
      ]);

      this.logger.info('Coupon created', { code: code.getValue(), value: value.getCents() });

      return Coupon.create(code, value);
    } catch (error) {
      this.logger.error('Failed to create coupon', error as Error, { code: code.getValue() });
      throw error;
    }
  }

  public async activate(code: CouponCode, userId: UserId): Promise<void> {
    try {
      await this.db.run(
        'UPDATE coupons SET is_activated = 1, activated_by_user_id = ?, activated_at = CURRENT_TIMESTAMP WHERE code = ?',
        [userId.getValue(), code.getValue()]
      );

      this.logger.info('Coupon activated', { code: code.getValue(), userId: userId.getValue() });
    } catch (error) {
      this.logger.error('Failed to activate coupon', error as Error, { code: code.getValue() });
      throw error;
    }
  }

  public async save(coupon: Coupon): Promise<void> {
    try {
      await this.db.run(
        `INSERT OR REPLACE INTO coupons (code, value_cents, is_activated, activated_by_user_id, activated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          coupon.getCode().getValue(),
          coupon.getValue().getCents(),
          coupon.getIsActivated() ? 1 : 0,
          coupon.getActivatedBy()?.getValue() || null,
          coupon.getActivatedAt()?.toISOString() || null,
        ]
      );

      this.logger.debug('Coupon saved', { code: coupon.getCode().getValue() });
    } catch (error) {
      this.logger.error('Failed to save coupon', error as Error, {
        code: coupon.getCode().getValue(),
      });
      throw error;
    }
  }
}
