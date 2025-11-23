export class PartNumber {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(value: string): PartNumber {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error('PartNumber cannot be empty');
    }
    return new PartNumber(trimmed);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: PartNumber): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

