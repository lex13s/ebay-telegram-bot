import { getIsoDateMinusDays } from './utils';

export interface BrowseApiConfig {
  filter: string;
  sort?: string;
}

export interface InsightsApiConfig {
  marketplaceId: string; // e.g., EBAY_US, EBAY_MOTORS_US
  periodDays: number; // how many days back to include
  sort?: string; // e.g., 'date_sold:desc'
}

export type EbaySearchConfig = BrowseApiConfig | InsightsApiConfig;

export function getEbaySearchConfig(configKey: string): EbaySearchConfig {
  const configs: { [key: string]: () => EbaySearchConfig } = {
    ACTIVE: (): BrowseApiConfig => ({
      filter: 'buyingOptions:{FIXED_PRICE}',
    }),
    SOLD: (): InsightsApiConfig => ({
      marketplaceId: process.env.DEFAULT_MARKETPLACE_ID || 'EBAY_US',
      periodDays: 90,
      sort: 'date_sold:desc',
    }),
    ENDED: (): InsightsApiConfig => ({
      marketplaceId: process.env.DEFAULT_MARKETPLACE_ID || 'EBAY_US',
      periodDays: 30,
      sort: 'date_sold:desc',
    }),
  };

  const configGenerator = configs[configKey];
  if (!configGenerator) {
    throw new Error(`Invalid eBay search config key: ${configKey}`);
  }

  return configGenerator();
}
