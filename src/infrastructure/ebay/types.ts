/**
 * Shared types for eBay API
 */

export interface EbayItemData {
  itemId: string;
  title: string;
  priceValue: string;
  priceCurrency: string;
}

export interface BrowseApiConfig {
  filter: string;
  sort?: string;
}

export interface FindingApiConfig {
  itemFilter: { name: string; value: string | string[] }[];
  sortOrder?: string;
}

export type EbaySearchConfig = BrowseApiConfig | FindingApiConfig;
