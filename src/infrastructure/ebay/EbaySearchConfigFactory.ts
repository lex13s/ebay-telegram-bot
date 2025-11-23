import { SearchConfigKey } from '../../domain';
import { EbaySearchConfig, BrowseApiConfig, FindingApiConfig } from './types';

/**
 * eBay search configuration factory
 */
export class EbaySearchConfigFactory {
  public static create(configKey: SearchConfigKey): EbaySearchConfig {
    const key = configKey.getValue();

    switch (key) {
      case 'ACTIVE':
        return this.createActiveConfig();
      case 'SOLD':
        return this.createSoldConfig();
      case 'ENDED':
        return this.createEndedConfig();
      default:
        throw new Error(`Invalid search config key: ${key}`);
    }
  }

  private static createActiveConfig(): BrowseApiConfig {
    return {
      filter: 'buyingOptions:{FIXED_PRICE}',
      sort: undefined,
    };
  }

  private static createSoldConfig(): FindingApiConfig {
    return {
      itemFilter: [{ name: 'SoldItemsOnly', value: 'true' }],
      sortOrder: 'EndTimeSoonest',
    };
  }

  private static createEndedConfig(): FindingApiConfig {
    return {
      itemFilter: [{ name: 'ListingType', value: 'FixedPrice' }],
      sortOrder: 'EndTimeSoonest',
    };
  }

  public static isBrowseConfig(config: EbaySearchConfig): config is BrowseApiConfig {
    return 'filter' in config;
  }

  public static isFindingConfig(config: EbaySearchConfig): config is FindingApiConfig {
    return 'itemFilter' in config;
  }
}

