import { PartNumber } from '../value-objects/PartNumber';

export interface SearchResultData {
  itemId: string;
  title: string;
  priceValue: string;
  priceCurrency: string;
}

export class SearchResult {
  private constructor(
    private readonly partNumber: PartNumber,
    private readonly data: SearchResultData | null
  ) {}

  public static createFound(partNumber: PartNumber, data: SearchResultData): SearchResult {
    return new SearchResult(partNumber, data);
  }

  public static createNotFound(partNumber: PartNumber): SearchResult {
    return new SearchResult(partNumber, null);
  }

  public getPartNumber(): PartNumber {
    return this.partNumber;
  }

  public getData(): SearchResultData | null {
    return this.data;
  }

  public isFound(): boolean {
    return this.data !== null;
  }

  public getTitle(): string {
    return this.data?.title || 'Not Found';
  }

  public getPrice(): string {
    if (!this.data) return 'N/A';
    return `${this.data.priceValue} ${this.data.priceCurrency}`;
  }
}
