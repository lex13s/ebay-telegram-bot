export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InsufficientFundsError extends DomainError {
  constructor(required: number, available: number) {
    super(`Insufficient funds: required $${(required / 100).toFixed(2)}, available $${(available / 100).toFixed(2)}`);
  }
}

export class InvalidCouponError extends DomainError {
  constructor(message: string = 'Invalid or already used coupon') {
    super(message);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(userId: number) {
    super(`User not found: ${userId}`);
  }
}

export class CouponNotFoundError extends DomainError {
  constructor(code: string) {
    super(`Coupon not found: ${code}`);
  }
}

export class InvalidPartNumberError extends DomainError {
  constructor(partNumber: string) {
    super(`Invalid part number: ${partNumber}`);
  }
}

