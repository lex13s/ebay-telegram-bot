export class Balance {
  private readonly cents: number;

  private constructor(cents: number) {
    this.cents = cents;
  }

  public static create(cents: number): Balance {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new Error('Balance must be a non-negative integer (cents)');
    }
    return new Balance(cents);
  }

  public static fromDollars(dollars: number): Balance {
    const cents = Math.round(dollars * 100);
    return Balance.create(cents);
  }

  public getCents(): number {
    return this.cents;
  }

  public getDollars(): number {
    return this.cents / 100;
  }

  public add(amount: Balance): Balance {
    return new Balance(this.cents + amount.cents);
  }

  public subtract(amount: Balance): Balance {
    const newAmount = this.cents - amount.cents;
    if (newAmount < 0) {
      throw new Error('Insufficient balance');
    }
    return new Balance(newAmount);
  }

  public isGreaterThanOrEqual(amount: Balance): boolean {
    return this.cents >= amount.cents;
  }

  public equals(other: Balance): boolean {
    return this.cents === other.cents;
  }

  public toString(): string {
    return `$${this.getDollars().toFixed(2)}`;
  }
}
