import { EbayItem } from '../src/types/ebay-api';

// Mock the external dependency 'ebay-api'
const mockBrowseSearch = jest.fn();
const mockFindingFindCompletedItems = jest.fn();
const mockSetCredentials = jest.fn();

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

// Ensure mocks are set up before the module under test is required
jest.doMock('ebay-api', () => ({
  __esModule: true,
  default: jest.fn(() => mockEbayApiInstance),
}));

// Mock the EbayAuthToken constructor and its getApplicationToken method
jest.doMock('ebay-oauth-nodejs-client', () => {
  return jest.fn().mockImplementation(() => ({
    getApplicationToken: jest.fn(() => Promise.resolve(JSON.stringify({ access_token: 'mockAppToken', expires_in: 3600 }))),
  }));
});

// Mock the config module as it's used by ebayApi.ts (if required later)
jest.doMock('../src/config', () => ({
  config: {
    ebayAppId: 'mockAppId',
    ebayCertId: 'mockCertId',
    ebayRuName: 'mockRuName',
    ebayDevId: 'mockDevId',
    ebayAuthToken: 'mockAuthToken',
  },
}));

// Dynamically import the module under test AFTER all mocks are set up
const { searchItemsByKeyword } = require('../src/ebayApi');

describe('ebayApi.ts', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockBrowseSearch.mockClear();
    mockFindingFindCompletedItems.mockClear();
    mockSetCredentials.mockClear();
    (require('ebay-api').default as jest.Mock).mockClear();
  });

  describe('searchItemsByKeyword', () => {
    it('should call searchActiveItems for ACTIVE config with a single keyword', async () => {
      mockBrowseSearch.mockResolvedValue({ itemSummaries: [{ title: 'Active Item' }] });

      const result = await searchItemsByKeyword(['test'], 'ACTIVE');

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

      expect(mockSetCredentials).not.toHaveBeenCalled();
      expect(mockFindingFindCompletedItems).toHaveBeenCalledTimes(1);
      expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({ keywords: 'test' }), expect.any(Object));
      expect(mockBrowseSearch).not.toHaveBeenCalled();
      expect(result).toEqual([[{ itemId: 'N/A', title: 'Sold Item', price: { value: '0', currency: 'N/A' } }]]);
    });

    it('should call searchCompletedItems for ENDED config with a single keyword', async () => {
      mockFindingFindCompletedItems.mockResolvedValue({ searchResult: { item: [{ title: 'Ended Item' }] } });

      const result = await searchItemsByKeyword(['test'], 'ENDED');

      expect(mockSetCredentials).not.toHaveBeenCalled();
      expect(mockFindingFindCompletedItems).toHaveBeenCalledTimes(1);
      expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({ keywords: 'test' }), expect.any(Object));
      expect(mockBrowseSearch).not.toHaveBeenCalled();
      expect(result).toEqual([[{ itemId: 'N/A', title: 'Ended Item', price: { value: '0', currency: 'N/A' } }]]);
    });

    it('should handle multiple keywords for ACTIVE config in parallel', async () => {
      mockBrowseSearch
        .mockResolvedValueOnce({ itemSummaries: [{ title: 'Active Item 1' }] })
        .mockResolvedValueOnce({ itemSummaries: [{ title: 'Active Item 2' }] });

      const result = await searchItemsByKeyword(['test1', 'test2'], 'ACTIVE');

      expect(mockSetCredentials).toHaveBeenCalledTimes(2); // set per keyword in current implementation
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

      expect(mockSetCredentials).not.toHaveBeenCalled();
      expect(mockFindingFindCompletedItems).toHaveBeenCalledTimes(2);
      expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({ keywords: 'test1' }), expect.any(Object));
      expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({ keywords: 'test2' }), expect.any(Object));
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

    it('should return empty arrays for all keywords if Browse API fails', async () => {
      mockBrowseSearch.mockRejectedValue(new Error('Token or Browse API failure'));

      const result = await searchItemsByKeyword(['test1', 'test2'], 'ACTIVE');

      expect(mockSetCredentials).toHaveBeenCalledTimes(2); // per keyword
      expect(mockBrowseSearch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([[], []]);
    });
  });
});
