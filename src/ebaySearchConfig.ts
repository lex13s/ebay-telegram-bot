import { getIsoDateMinusDays } from './utils';

export interface BrowseApiConfig {
  filter: string;
  sort?: string;
}

export interface FindingApiConfig {
  itemFilter: { name: string; value: string | boolean }[];
  sortOrder?: string;
}

export type EbaySearchConfig = BrowseApiConfig | FindingApiConfig;

export function getEbaySearchConfig(configKey: string): EbaySearchConfig {
  const configs: { [key: string]: () => EbaySearchConfig } = {
    ACTIVE: (): BrowseApiConfig => ({
      filter: 'buyingOptions:{FIXED_PRICE}',
    }),
    SOLD: (): FindingApiConfig => ({
      itemFilter: [
        { name: 'SoldItemsOnly', value: true },
        { name: 'EndTimeFrom', value: getIsoDateMinusDays(30) },
      ],
      sortOrder: 'EndTimeSoonest',
    }),
    ENDED: (): FindingApiConfig => ({
      itemFilter: [
        { name: 'SoldItemsOnly', value: false },
        { name: 'EndTimeFrom', value: getIsoDateMinusDays(20) },
      ],
      sortOrder: 'EndTimeSoonest',
    }),
  };

  const configGenerator = configs[configKey];
  if (!configGenerator) {
    throw new Error(`Invalid eBay search config key: ${configKey}`);
  }

  return configGenerator();
}
