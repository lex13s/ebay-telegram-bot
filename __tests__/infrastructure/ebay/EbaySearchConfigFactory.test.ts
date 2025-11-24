/**
 * Tests for EbaySearchConfigFactory
 */

import { EbaySearchConfigFactory } from '../../../src/infrastructure/ebay/EbaySearchConfigFactory';
import { SearchConfigKey } from '../../../src/domain/value-objects/SearchConfigKey';
import { BrowseApiConfig, FindingApiConfig } from '../../../src/infrastructure/ebay/types';

describe('Infrastructure Layer - eBay: EbaySearchConfigFactory', () => {
  describe('create - ACTIVE config', () => {
    it('should create Browse API config for ACTIVE', () => {
      const configKey = SearchConfigKey.create('ACTIVE');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(config).toBeDefined();
      expect(EbaySearchConfigFactory.isBrowseConfig(config)).toBe(true);
      expect(EbaySearchConfigFactory.isFindingConfig(config)).toBe(false);
    });

    it('should have correct filter for ACTIVE', () => {
      const configKey = SearchConfigKey.create('ACTIVE');
      const config = EbaySearchConfigFactory.create(configKey) as BrowseApiConfig;

      expect(config.filter).toBe('buyingOptions:{FIXED_PRICE}');
    });

    it('should have undefined sort for ACTIVE', () => {
      const configKey = SearchConfigKey.create('ACTIVE');
      const config = EbaySearchConfigFactory.create(configKey) as BrowseApiConfig;

      expect(config.sort).toBeUndefined();
    });

    it('should match BrowseApiConfig structure', () => {
      const configKey = SearchConfigKey.create('ACTIVE');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(config).toHaveProperty('filter');
      expect(config).not.toHaveProperty('itemFilter');
      expect(config).not.toHaveProperty('sortOrder');
    });
  });

  describe('create - SOLD config', () => {
    it('should create Finding API config for SOLD', () => {
      const configKey = SearchConfigKey.create('SOLD');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(config).toBeDefined();
      expect(EbaySearchConfigFactory.isFindingConfig(config)).toBe(true);
      expect(EbaySearchConfigFactory.isBrowseConfig(config)).toBe(false);
    });

    it('should have SoldItemsOnly filter for SOLD', () => {
      const configKey = SearchConfigKey.create('SOLD');
      const config = EbaySearchConfigFactory.create(configKey) as FindingApiConfig;

      expect(config.itemFilter).toBeDefined();
      expect(config.itemFilter).toHaveLength(1);
      expect(config.itemFilter[0]).toEqual({
        name: 'SoldItemsOnly',
        value: 'true',
      });
    });

    it('should have EndTimeSoonest sort for SOLD', () => {
      const configKey = SearchConfigKey.create('SOLD');
      const config = EbaySearchConfigFactory.create(configKey) as FindingApiConfig;

      expect(config.sortOrder).toBe('EndTimeSoonest');
    });

    it('should match FindingApiConfig structure', () => {
      const configKey = SearchConfigKey.create('SOLD');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(config).toHaveProperty('itemFilter');
      expect(config).toHaveProperty('sortOrder');
      expect(config).not.toHaveProperty('filter');
    });
  });

  describe('create - ENDED config', () => {
    it('should create Finding API config for ENDED', () => {
      const configKey = SearchConfigKey.create('ENDED');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(config).toBeDefined();
      expect(EbaySearchConfigFactory.isFindingConfig(config)).toBe(true);
      expect(EbaySearchConfigFactory.isBrowseConfig(config)).toBe(false);
    });

    it('should have ListingType filter for ENDED', () => {
      const configKey = SearchConfigKey.create('ENDED');
      const config = EbaySearchConfigFactory.create(configKey) as FindingApiConfig;

      expect(config.itemFilter).toBeDefined();
      expect(config.itemFilter).toHaveLength(1);
      expect(config.itemFilter[0]).toEqual({
        name: 'ListingType',
        value: 'FixedPrice',
      });
    });

    it('should have EndTimeSoonest sort for ENDED', () => {
      const configKey = SearchConfigKey.create('ENDED');
      const config = EbaySearchConfigFactory.create(configKey) as FindingApiConfig;

      expect(config.sortOrder).toBe('EndTimeSoonest');
    });

    it('should match FindingApiConfig structure', () => {
      const configKey = SearchConfigKey.create('ENDED');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(config).toHaveProperty('itemFilter');
      expect(config).toHaveProperty('sortOrder');
      expect(config).not.toHaveProperty('filter');
    });
  });

  describe('isBrowseConfig type guard', () => {
    it('should return true for ACTIVE config', () => {
      const configKey = SearchConfigKey.create('ACTIVE');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(EbaySearchConfigFactory.isBrowseConfig(config)).toBe(true);
    });

    it('should return false for SOLD config', () => {
      const configKey = SearchConfigKey.create('SOLD');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(EbaySearchConfigFactory.isBrowseConfig(config)).toBe(false);
    });

    it('should return false for ENDED config', () => {
      const configKey = SearchConfigKey.create('ENDED');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(EbaySearchConfigFactory.isBrowseConfig(config)).toBe(false);
    });

    it('should narrow type to BrowseApiConfig', () => {
      const configKey = SearchConfigKey.create('ACTIVE');
      const config = EbaySearchConfigFactory.create(configKey);

      if (EbaySearchConfigFactory.isBrowseConfig(config)) {
        // TypeScript should narrow type here
        expect(config.filter).toBeDefined();
        expect('sort' in config).toBe(true);
      }
    });
  });

  describe('isFindingConfig type guard', () => {
    it('should return false for ACTIVE config', () => {
      const configKey = SearchConfigKey.create('ACTIVE');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(EbaySearchConfigFactory.isFindingConfig(config)).toBe(false);
    });

    it('should return true for SOLD config', () => {
      const configKey = SearchConfigKey.create('SOLD');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(EbaySearchConfigFactory.isFindingConfig(config)).toBe(true);
    });

    it('should return true for ENDED config', () => {
      const configKey = SearchConfigKey.create('ENDED');
      const config = EbaySearchConfigFactory.create(configKey);

      expect(EbaySearchConfigFactory.isFindingConfig(config)).toBe(true);
    });

    it('should narrow type to FindingApiConfig', () => {
      const configKey = SearchConfigKey.create('SOLD');
      const config = EbaySearchConfigFactory.create(configKey);

      if (EbaySearchConfigFactory.isFindingConfig(config)) {
        // TypeScript should narrow type here
        expect(config.itemFilter).toBeDefined();
        expect(config.sortOrder).toBeDefined();
      }
    });
  });

  describe('config differences', () => {
    it('SOLD and ENDED should have different filters', () => {
      const soldKey = SearchConfigKey.create('SOLD');
      const endedKey = SearchConfigKey.create('ENDED');

      const soldConfig = EbaySearchConfigFactory.create(soldKey) as FindingApiConfig;
      const endedConfig = EbaySearchConfigFactory.create(endedKey) as FindingApiConfig;

      expect(soldConfig.itemFilter[0].name).not.toBe(endedConfig.itemFilter[0].name);
    });

    it('SOLD and ENDED should have same sort order', () => {
      const soldKey = SearchConfigKey.create('SOLD');
      const endedKey = SearchConfigKey.create('ENDED');

      const soldConfig = EbaySearchConfigFactory.create(soldKey) as FindingApiConfig;
      const endedConfig = EbaySearchConfigFactory.create(endedKey) as FindingApiConfig;

      expect(soldConfig.sortOrder).toBe(endedConfig.sortOrder);
      expect(soldConfig.sortOrder).toBe('EndTimeSoonest');
    });

    it('ACTIVE config should be distinct from Finding configs', () => {
      const activeKey = SearchConfigKey.create('ACTIVE');
      const soldKey = SearchConfigKey.create('SOLD');

      const activeConfig = EbaySearchConfigFactory.create(activeKey);
      const soldConfig = EbaySearchConfigFactory.create(soldKey);

      expect(EbaySearchConfigFactory.isBrowseConfig(activeConfig)).toBe(true);
      expect(EbaySearchConfigFactory.isFindingConfig(soldConfig)).toBe(true);
      expect(EbaySearchConfigFactory.isBrowseConfig(soldConfig)).toBe(false);
      expect(EbaySearchConfigFactory.isFindingConfig(activeConfig)).toBe(false);
    });
  });

  describe('config consistency', () => {
    it('should create same config for same key', () => {
      const key1 = SearchConfigKey.create('ACTIVE');
      const key2 = SearchConfigKey.create('ACTIVE');

      const config1 = EbaySearchConfigFactory.create(key1);
      const config2 = EbaySearchConfigFactory.create(key2);

      expect(config1).toEqual(config2);
    });

    it('should create different configs for different keys', () => {
      const activeKey = SearchConfigKey.create('ACTIVE');
      const soldKey = SearchConfigKey.create('SOLD');

      const activeConfig = EbaySearchConfigFactory.create(activeKey);
      const soldConfig = EbaySearchConfigFactory.create(soldKey);

      expect(activeConfig).not.toEqual(soldConfig);
    });
  });

  describe('all config keys support', () => {
    it('should support all SearchConfigKey values', () => {
      const keys = ['ACTIVE', 'SOLD', 'ENDED'];

      keys.forEach((key) => {
        const configKey = SearchConfigKey.create(key);
        expect(() => EbaySearchConfigFactory.create(configKey)).not.toThrow();
      });
    });

    it('should create config for each key type', () => {
      const activeConfig = EbaySearchConfigFactory.create(SearchConfigKey.create('ACTIVE'));
      const soldConfig = EbaySearchConfigFactory.create(SearchConfigKey.create('SOLD'));
      const endedConfig = EbaySearchConfigFactory.create(SearchConfigKey.create('ENDED'));

      expect(activeConfig).toBeDefined();
      expect(soldConfig).toBeDefined();
      expect(endedConfig).toBeDefined();
    });
  });

  describe('type guard mutual exclusivity', () => {
    it('config cannot be both Browse and Finding', () => {
      const configs = [
        EbaySearchConfigFactory.create(SearchConfigKey.create('ACTIVE')),
        EbaySearchConfigFactory.create(SearchConfigKey.create('SOLD')),
        EbaySearchConfigFactory.create(SearchConfigKey.create('ENDED')),
      ];

      configs.forEach((config) => {
        const isBrowse = EbaySearchConfigFactory.isBrowseConfig(config);
        const isFinding = EbaySearchConfigFactory.isFindingConfig(config);

        expect(isBrowse).not.toBe(isFinding);
        expect(isBrowse || isFinding).toBe(true);
      });
    });
  });

  describe('config structure validation', () => {
    it('BrowseApiConfig should have required properties', () => {
      const config = EbaySearchConfigFactory.create(
        SearchConfigKey.create('ACTIVE')
      ) as BrowseApiConfig;

      expect(typeof config.filter).toBe('string');
      expect(['string', 'undefined']).toContain(typeof config.sort);
    });

    it('FindingApiConfig should have required properties', () => {
      const config = EbaySearchConfigFactory.create(
        SearchConfigKey.create('SOLD')
      ) as FindingApiConfig;

      expect(Array.isArray(config.itemFilter)).toBe(true);
      expect(typeof config.sortOrder).toBe('string');
    });

    it('FindingApiConfig itemFilter should have correct structure', () => {
      const configs = [
        EbaySearchConfigFactory.create(SearchConfigKey.create('SOLD')),
        EbaySearchConfigFactory.create(SearchConfigKey.create('ENDED')),
      ];

      configs.forEach((config) => {
        if (EbaySearchConfigFactory.isFindingConfig(config)) {
          config.itemFilter.forEach((filter) => {
            expect(filter).toHaveProperty('name');
            expect(filter).toHaveProperty('value');
            expect(typeof filter.name).toBe('string');
            expect(typeof filter.value).toBe('string');
          });
        }
      });
    });
  });
});
