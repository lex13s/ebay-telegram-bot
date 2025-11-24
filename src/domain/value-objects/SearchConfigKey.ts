export type SearchConfigType = 'ACTIVE' | 'SOLD' | 'ENDED';

export class SearchConfigKey {
  private readonly value: SearchConfigType;

  private constructor(value: SearchConfigType) {
    this.value = value;
  }

  public static create(value: string): SearchConfigKey {
    const normalized = value.toUpperCase();
    if (!['ACTIVE', 'SOLD', 'ENDED'].includes(normalized)) {
      throw new Error(`Invalid search config key: ${value}`);
    }
    return new SearchConfigKey(normalized as SearchConfigType);
  }

  public static default(): SearchConfigKey {
    return new SearchConfigKey('SOLD');
  }

  public getValue(): SearchConfigType {
    return this.value;
  }

  public equals(other: SearchConfigKey): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
