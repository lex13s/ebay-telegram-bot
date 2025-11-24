import { EbayConfig } from '../config';
import { EbayItemData, BrowseApiConfig } from './types';
import { ILogger } from '../logging';

export class EbayBrowseApiClient {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private readonly config: EbayConfig,
    private readonly logger: ILogger
  ) {}

  public async searchActiveItems(
    keyword: string,
    searchConfig: BrowseApiConfig
  ): Promise<EbayItemData[]> {
    try {
      await this.ensureValidToken();

      const params = new URLSearchParams({
        q: keyword,
        limit: this.config.searchLimit.toString(),
        filter: searchConfig.filter,
      });

      const response = await fetch(`${this.config.browseApiUrl}/item_summary/search?${params}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`eBay Browse API error: ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.itemSummaries || [];

      const results = items.map((item: any) => ({
        itemId: item.itemId ?? 'N/A',
        title: item.title ?? 'No Title',
        priceValue: item.price?.value ?? '0',
        priceCurrency: item.price?.currency ?? 'USD',
      }));

      return results;
    } catch (error) {
      this.logger.error('eBay Browse API search failed', error as Error, { keyword });
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return;
    }

    await this.refreshToken();
  }

  private async refreshToken(): Promise<void> {
    try {
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');

      const response = await fetch(this.config.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      });

      if (!response.ok) {
        throw new Error(`OAuth failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.token = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;

      this.logger.debug('eBay OAuth token refreshed');
    } catch (error) {
      this.logger.error('Failed to refresh eBay token', error as Error);
      throw error;
    }
  }
}
