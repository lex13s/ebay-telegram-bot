export interface BrowseApiConfig {
  filter: string;
  sort?: string;
}

export interface FindingApiConfig {
  itemFilter: { name: string; value: string | string[] }[];
  sortOrder?: string;
}

export type EbaySearchConfig = BrowseApiConfig | FindingApiConfig;

export function getEbaySearchConfig(configKey: string): EbaySearchConfig {
  const configs: { [key: string]: () => EbaySearchConfig } = {
    ACTIVE: (): BrowseApiConfig => ({
      filter: 'buyingOptions:{FIXED_PRICE}',
      sort: undefined,
    }),
    SOLD: (): FindingApiConfig => ({
      itemFilter: [{ name: 'SoldItemsOnly', value: 'true' }],
      sortOrder: 'EndTimeSoonest',
    }),
    ENDED: (): FindingApiConfig => ({
      itemFilter: [{ name: 'ListingType', value: 'FixedPrice' }],
      sortOrder: 'EndTimeSoonest',
    }),
  };

  const gen = configs[configKey];
  if (!gen) throw new Error(`Invalid eBay search config key: ${configKey}`);
  return gen();
}
