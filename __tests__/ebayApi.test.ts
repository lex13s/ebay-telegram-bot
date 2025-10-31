import { searchItemsByKeyword } from '../src/ebayApi';

// Mock the external dependency 'ebay-api'
// This mock will return the same mockEbayApi object every time new eBayApi() is called
const mockEbayApi = {
  buy: {
    browse: {
      search: jest.fn(),
    },
  },
  finding: {
    findCompletedItems: jest.fn(),
  },
  OAuth2: { // Add OAuth2 mock
    setCredentials: jest.fn(),
  },
};

jest.mock('ebay-api', () => {
  return jest.fn(() => mockEbayApi); // Always return the same mockEbayApi object
});

// Mock the config module as it's used by ebayApi.ts
jest.mock('../src/config', () => ({
  config: {
    ebayAppId: 'mockAppId',
    ebayCertId: 'mockCertId',
    ebayRuName: 'mockRuName',
    ebayDevId: 'mockDevId',
    ebayAuthToken: 'mockAuthToken',
  },
}));

// Get the mocked instance of eBayApi (it's the same object returned by the mock)
const MockEbayApiConstructor = require('ebay-api');
const mockEbayApiInstance = MockEbayApiConstructor(); // This will be the 'mockEbayApi' object

describe('ebayApi.ts', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockEbayApiInstance.buy.browse.search.mockClear();
    mockEbayApiInstance.finding.findCompletedItems.mockClear();
    mockEbayApiInstance.OAuth2.setCredentials.mockClear(); // Clear OAuth2 mock
    MockEbayApiConstructor.mockClear(); // Clear the constructor mock as well
  });

  describe('searchItemsByKeyword', () => {
    it('should call searchActiveItems for ACTIVE config', async () => {
      // Mock the specific API call that searchActiveItems makes
      mockEbayApiInstance.buy.browse.search.mockResolvedValue({ itemSummaries: [{ title: 'Active Item' }] });
      mockEbayApiInstance.OAuth2.setCredentials.mockResolvedValue(true); // Mock setCredentials

      await searchItemsByKeyword('test', 'ACTIVE');

      expect(MockEbayApiConstructor).toHaveBeenCalledTimes(1); // Expect constructor to be called
      expect(mockEbayApiInstance.OAuth2.setCredentials).toHaveBeenCalledTimes(1); // Expect setCredentials to be called
      expect(mockEbayApiInstance.buy.browse.search).toHaveBeenCalledTimes(1);
      expect(mockEbayApiInstance.buy.browse.search).toHaveBeenCalledWith(expect.any(Object));
      expect(mockEbayApiInstance.finding.findCompletedItems).not.toHaveBeenCalled();
    });

    it('should call searchCompletedItems for SOLD config', async () => {
      // Mock the specific API call that searchCompletedItems makes
      mockEbayApiInstance.finding.findCompletedItems.mockResolvedValue({ searchResult: { item: [{ title: 'Sold Item' }] } });

      await searchItemsByKeyword('test', 'SOLD');

      expect(MockEbayApiConstructor).toHaveBeenCalledTimes(1); // Expect constructor to be called
      expect(mockEbayApiInstance.finding.findCompletedItems).toHaveBeenCalledTimes(1);
      expect(mockEbayApiInstance.finding.findCompletedItems).toHaveBeenCalledWith(expect.any(Object));
      expect(mockEbayApiInstance.buy.browse.search).not.toHaveBeenCalled();
    });

    it('should call searchCompletedItems for ENDED config', async () => {
      // Mock the specific API call that searchCompletedItems makes
      mockEbayApiInstance.finding.findCompletedItems.mockResolvedValue({ searchResult: { item: [{ title: 'Ended Item' }] } });

      await searchItemsByKeyword('test', 'ENDED');

      expect(MockEbayApiConstructor).toHaveBeenCalledTimes(1); // Expect constructor to be called
      expect(mockEbayApiInstance.finding.findCompletedItems).toHaveBeenCalledTimes(1);
      expect(mockEbayApiInstance.finding.findCompletedItems).toHaveBeenCalledWith(expect.any(Object));
      expect(mockEbayApiInstance.buy.browse.search).not.toHaveBeenCalled();
    });
  });
});
