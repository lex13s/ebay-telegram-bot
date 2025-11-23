import eBayApi from 'ebay-api';
import { EbayConfig } from '../config/EbayConfig';
import { ILogger } from '../logging/Logger';
import { EbayItemData, FindingApiConfig } from './types';

/**
 * eBay Finding API client for searching sold/ended listings
 */
export class EbayFindingApiClient {
  private ebayApi: eBayApi;

  constructor(
    private readonly config: EbayConfig,
    private readonly logger: ILogger
  ) {
    this.ebayApi = new eBayApi({
      appId: config.clientId,
      certId: config.clientSecret,
      devId: 'dummy',
      sandbox: config.sandbox,
    });
  }

  public async searchCompletedItems(keyword: string, config: FindingApiConfig): Promise<EbayItemData[]> {
    try {
      this.logger.debug('Searching completed items on eBay', { keyword });

      const requestParams: any = {
        keywords: keyword,
        itemFilter: config.itemFilter,
        outputSelector: ['AspectHistogram'],
        paginationInput: {
          entriesPerPage: this.config.searchLimit,
          pageNumber: 1,
        },
      };

      if (config.sortOrder) {
        requestParams.sortOrder = config.sortOrder;
      }

      const response = await this.ebayApi.finding.findCompletedItems(requestParams);

      const items = response.searchResult?.item || [];

      const results = items.map((item: any) => ({
        itemId: item.itemId ?? 'N/A',
        title: item.title ?? 'No Title',
        priceValue: item.sellingStatus?.currentPrice?.value?.toString() ?? '0',
        priceCurrency: item.sellingStatus?.currentPrice?.currencyId ?? 'N/A',
      }));

      this.logger.debug('Finding API search completed', { keyword, resultCount: results.length });

      return results;
    } catch (error) {
      this.logger.error('Finding API search failed', error as Error, { keyword });
      return [];
    }
  }
}

