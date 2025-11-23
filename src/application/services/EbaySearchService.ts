import { PartNumber } from '../../domain/value-objects/PartNumber';
import { SearchResult, SearchResultData } from '../../domain/entities/SearchResult';
import { SearchConfigKey } from '../../domain/value-objects/SearchConfigKey';
import { EbayBrowseApiClient } from '../../infrastructure/ebay/EbayBrowseApiClient';
import { EbayFindingApiClient } from '../../infrastructure/ebay/EbayFindingApiClient';
import { EbaySearchConfigFactory } from '../../infrastructure/ebay/EbaySearchConfigFactory';
import { ILogger } from '../../infrastructure/logging/Logger';

/**
 * Service for searching items on eBay
 */
export class EbaySearchService {
  constructor(
    private readonly browseClient: EbayBrowseApiClient,
    private readonly findingClient: EbayFindingApiClient,
    private readonly logger: ILogger
  ) {}

  public async search(partNumbers: PartNumber[], configKey: SearchConfigKey): Promise<SearchResult[]> {
    this.logger.info('Starting eBay search', {
      partNumbersCount: partNumbers.length,
      configKey: configKey.toString()
    });

    const searchConfig = EbaySearchConfigFactory.create(configKey);
    const isActiveSearch = EbaySearchConfigFactory.isBrowseConfig(searchConfig);

    const searchPromises = partNumbers.map(async (partNumber) => {
      const keyword = partNumber.getValue();

      let items;
      if (isActiveSearch) {
        items = await this.browseClient.searchActiveItems(keyword, searchConfig);
      } else {
        items = await this.findingClient.searchCompletedItems(keyword, searchConfig);
      }

      if (items.length === 0) {
        return SearchResult.createNotFound(partNumber);
      }

      const firstItem = items[0];
      const resultData: SearchResultData = {
        itemId: firstItem.itemId,
        title: firstItem.title,
        priceValue: firstItem.priceValue,
        priceCurrency: firstItem.priceCurrency,
      };

      return SearchResult.createFound(partNumber, resultData);
    });

    const results = await Promise.all(searchPromises);

    this.logger.info('eBay search completed', {
      totalResults: results.length,
      foundItems: results.filter(r => r.isFound()).length
    });

    return results;
  }
}

