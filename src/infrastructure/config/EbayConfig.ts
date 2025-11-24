import { EnvConfig } from './EnvConfig';

/**
 * eBay API configuration
 */
export interface EbayConfig {
  clientId: string;
  clientSecret: string;
  sandbox: boolean;
  marketplaceId: string;
  searchLimit: string;
  browseApiUrl: string;
  findingApiUrl: string;
  oauthUrl: string;
}

export function createEbayConfig(env: EnvConfig): EbayConfig {
  const isProduction = env.NODE_ENV === 'production';

  return {
    clientId: env.EBAY_CLIENT_ID,
    clientSecret: env.EBAY_CLIENT_SECRET,
    sandbox: !isProduction,
    marketplaceId: 'EBAY_US',
    searchLimit: '1',
    browseApiUrl: isProduction
      ? 'https://api.ebay.com/buy/browse/v1'
      : 'https://api.sandbox.ebay.com/buy/browse/v1',
    findingApiUrl: isProduction
      ? 'https://svcs.ebay.com/services/search/FindingService/v1'
      : 'https://svcs.sandbox.ebay.com/services/search/FindingService/v1',
    oauthUrl: isProduction
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
  };
}
