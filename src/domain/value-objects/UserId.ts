export class UserId {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  public static create(value: number): UserId {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('UserId must be a positive integer');
    }
    return new UserId(value);
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: UserId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value.toString();
  }
}
