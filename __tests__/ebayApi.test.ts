import { EbayItem } from '../src/types/ebay-api';

// Define mocks before any jest.doMock calls
const mockBrowseSearch = jest.fn();
const mockFindingFindCompletedItems = jest.fn();
const mockSetCredentials = jest.fn();
const mockGetApplicationToken = jest.fn();

const mockEbayApiInstance = {
  buy: {
    browse: {
      search: mockBrowseSearch,
    },
  },
  finding: {
    findCompletedItems: mockFindingFindCompletedItems,
  },
  OAuth2: {
    setCredentials: mockSetCredentials,
  },
};

const mockEbayApiConstructor = jest.fn(() => mockEbayApiInstance);
const mockEbayAuthTokenConstructor = jest.fn(() => ({
  getApplicationToken: mockGetApplicationToken,
}));

// Use jest.doMock to ensure mocks are set up before the module under test is required
jest.doMock('ebay-api', () => ({
  __esModule: true,
  default: mockEbayApiConstructor,
}));

jest.doMock('ebay-oauth-nodejs-client', () => ({
  __esModule: true,
  default: mockEbayAuthTokenConstructor,
}));

jest.doMock('../src/config', () => ({
  config: {
    ebayAppId: 'mockAppId',
    ebayCertId: 'mockCertId',
    ebayRuName: 'mockRuName',
    ebayDevId: 'mockDevId',
    ebayAuthToken: 'mockAuthToken',
  },
}));

describe('ebayApi.ts', () => {
  let searchItemsByKeyword: (keywords: string[], configKey: string) => Promise<EbayItem[][]>;

  beforeEach(() => {
    // Reset modules to ensure mocks are applied to a fresh instance of the module
    jest.resetModules();
    
    // Dynamically import the module under test AFTER all mocks are set up
    const ebayApiModule = require('../src/ebayApi');
    searchItemsByKeyword = ebayApiModule.searchItemsByKeyword;

    // Clear all mocks before each test
    mockBrowseSearch.mockClear();
    mockFindingFindCompletedItems.mockClear();
    mockSetCredentials.mockClear();
    mockEbayApiConstructor.mockClear();
    mockEbayAuthTokenConstructor.mockClear();
    mockGetApplicationToken.mockClear();

    // Reset mock implementations to default successful state
    mockGetApplicationToken.mockResolvedValue(JSON.stringify({ access_token: 'mockAppToken', expires_in: 3600 }));
  });

  describe('searchItemsByKeyword', () => {
    it('should call searchActiveItems for ACTIVE config with a single keyword', async () => {
      mockBrowseSearch.mockResolvedValue({ itemSummaries: [{ title: 'Active Item' }] });

      const result = await searchItemsByKeyword(['test'], 'ACTIVE');

      expect(mockEbayApiConstructor).toHaveBeenCalledTimes(1);
      expect(mockEbayAuthTokenConstructor).toHaveBeenCalledTimes(1);
      expect(mockGetApplicationToken).toHaveBeenCalledTimes(1);
      expect(mockSetCredentials).toHaveBeenCalledTimes(1);
      expect(mockSetCredentials).toHaveBeenCalledWith('mockAppToken');
      expect(mockBrowseSearch).toHaveBeenCalledTimes(1);
      expect(mockBrowseSearch).toHaveBeenCalledWith(expect.objectContaining({ q: 'test' }));
      expect(mockFindingFindCompletedItems).not.toHaveBeenCalled();
      expect(result).toEqual([[{ itemId: 'N/A', title: 'Active Item', price: { value: '0', currency: 'N/A' } }]]);
    });

    it('should call searchCompletedItems for SOLD config with a single keyword', async () => {
      mockFindingFindCompletedItems.mockResolvedValue({ searchResult: { item: [{ title: 'Sold Item' }] } });

      const result = await searchItemsByKeyword(['test'], 'SOLD');

      expect(mockEbayApiConstructor).toHaveBeenCalledTimes(1);
      expect(mockEbayAuthTokenConstructor).not.toHaveBeenCalled();
      expect(mockGetApplicationToken).not.toHaveBeenCalled();
      expect(mockSetCredentials).not.toHaveBeenCalled();
      expect(mockFindingFindCompletedItems).toHaveBeenCalledTimes(1);
      expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({ keywords: 'test' }));
      expect(mockBrowseSearch).not.toHaveBeenCalled();
      expect(result).toEqual([[{ itemId: 'N/A', title: 'Sold Item', price: { value: '0', currency: 'N/A' } }]]);
    });

    it('should call searchCompletedItems for ENDED config with a single keyword', async () => {
      mockFindingFindCompletedItems.mockResolvedValue({ searchResult: { item: [{ title: 'Ended Item' }] } });

      const result = await searchItemsByKeyword(['test'], 'ENDED');

      expect(mockEbayApiConstructor).toHaveBeenCalledTimes(1);
      expect(mockEbayAuthTokenConstructor).not.toHaveBeenCalled();
      expect(mockGetApplicationToken).not.toHaveBeenCalled();
      expect(mockSetCredentials).not.toHaveBeenCalled();
      expect(mockFindingFindCompletedItems).toHaveBeenCalledTimes(1);
      expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({ keywords: 'test' }));
      expect(mockBrowseSearch).not.toHaveBeenCalled();
      expect(result).toEqual([[{ itemId: 'N/A', title: 'Ended Item', price: { value: '0', currency: 'N/A' } }]]);
    });

    it('should handle multiple keywords for ACTIVE config in parallel', async () => {
      mockBrowseSearch
        .mockResolvedValueOnce({ itemSummaries: [{ title: 'Active Item 1' }] })
        .mockResolvedValueOnce({ itemSummaries: [{ title: 'Active Item 2' }] });

      const result = await searchItemsByKeyword(['test1', 'test2'], 'ACTIVE');

      expect(mockEbayApiConstructor).toHaveBeenCalledTimes(1);
      expect(mockEbayAuthTokenConstructor).toHaveBeenCalledTimes(1);
      expect(mockGetApplicationToken).toHaveBeenCalledTimes(1);
      expect(mockSetCredentials).toHaveBeenCalledTimes(1);
      expect(mockBrowseSearch).toHaveBeenCalledTimes(2);
      expect(mockBrowseSearch).toHaveBeenCalledWith(expect.objectContaining({ q: 'test1' }));
      expect(mockBrowseSearch).toHaveBeenCalledWith(expect.objectContaining({ q: 'test2' }));
      expect(result).toEqual([
        [{ itemId: 'N/A', title: 'Active Item 1', price: { value: '0', currency: 'N/A' } }],
        [{ itemId: 'N/A', title: 'Active Item 2', price: { value: '0', currency: 'N/A' } }],
      ]);
    });

    it('should handle multiple keywords for SOLD config in parallel', async () => {
      mockFindingFindCompletedItems
        .mockResolvedValueOnce({ searchResult: { item: [{ title: 'Sold Item 1' }] } })
        .mockResolvedValueOnce({ searchResult: { item: [{ title: 'Sold Item 2' }] } });

      const result = await searchItemsByKeyword(['test1', 'test2'], 'SOLD');

      expect(mockEbayApiConstructor).toHaveBeenCalledTimes(1);
      expect(mockEbayAuthTokenConstructor).not.toHaveBeenCalled();
      expect(mockGetApplicationToken).not.toHaveBeenCalled();
      expect(mockSetCredentials).not.toHaveBeenCalled();
      expect(mockFindingFindCompletedItems).toHaveBeenCalledTimes(2);
      expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({ keywords: 'test1' }));
      expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({ keywords: 'test2' }));
      expect(result).toEqual([
        [{ itemId: 'N/A', title: 'Sold Item 1', price: { value: '0', currency: 'N/A' } }],
        [{ itemId: 'N/A', title: 'Sold Item 2', price: { value: '0', currency: 'N/A' } }],
      ]);
    });

    it('should return empty arrays for keywords that result in an error in searchActiveItems', async () => {
      mockBrowseSearch
        .mockResolvedValueOnce({ itemSummaries: [{ title: 'Active Item 1' }] })
        .mockRejectedValueOnce(new Error('API Error for test2'));

      const result = await searchItemsByKeyword(['test1', 'test2'], 'ACTIVE');

      expect(mockBrowseSearch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        [{ itemId: 'N/A', title: 'Active Item 1', price: { value: '0', currency: 'N/A' } }],
        [],
      ]);
    });

    it('should return empty arrays for keywords that result in an error in searchCompletedItems', async () => {
      mockFindingFindCompletedItems
        .mockResolvedValueOnce({ searchResult: { item: [{ title: 'Sold Item 1' }] } })
        .mockRejectedValueOnce(new Error('API Error for test2'));

      const result = await searchItemsByKeyword(['test1', 'test2'], 'SOLD');

      expect(mockFindingFindCompletedItems).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        [{ itemId: 'N/A', title: 'Sold Item 1', price: { value: '0', currency: 'N/A' } }],
        [],
      ]);
    });

    it('should return empty arrays for all keywords if getEbayAppToken fails', async () => {
      mockGetApplicationToken.mockRejectedValue(new Error('Token fetch failed'));

      const result = await searchItemsByKeyword(['test1', 'test2'], 'ACTIVE');

      expect(mockEbayAuthTokenConstructor).toHaveBeenCalledTimes(1);
      expect(mockGetApplicationToken).toHaveBeenCalledTimes(1);
      expect(mockSetCredentials).not.toHaveBeenCalled();
      expect(mockBrowseSearch).not.toHaveBeenCalled();
      expect(result).toEqual([[], []]);
    });
  });
});
