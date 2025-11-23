import { randomBytes } from 'crypto';

export class CouponCode {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(value: string): CouponCode {
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length === 0) {
      throw new Error('CouponCode cannot be empty');
    }
    return new CouponCode(trimmed);
  }

  public static generate(): CouponCode {
    const bytes = randomBytes(4);
    const code = `C-${bytes.toString('hex').toUpperCase()}`;
    return new CouponCode(code);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: CouponCode): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

