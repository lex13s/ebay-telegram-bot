import { searchItemsByKeyword } from './ebayApi';
import eBayApi from 'ebay-api';

// Mock the entire ebay-api library
jest.mock('ebay-api', () => {
  const mockBuyBrowseSearch = jest.fn();
  const mockFindingFindCompletedItems = jest.fn();

  return jest.fn().mockImplementation(() => ({
    buy: {
      browse: {
        search: mockBuyBrowseSearch,
      },
    },
    finding: {
      findCompletedItems: mockFindingFindCompletedItems,
    },
    OAuth2: {
        setCredentials: jest.fn(),
    }
  }));
});

// Mock the token functionality as it's not relevant to this test
jest.mock('./ebayApi', () => {
    const originalModule = jest.requireActual('./ebayApi');
    return {
        ...originalModule,
        getEbayAppToken: jest.fn().mockResolvedValue('fake-token'),
    };
});

describe('searchItemsByKeyword', () => {
  let mockEbayApiInstance: any;
  let mockBuyBrowseSearch: jest.Mock;
  let mockFindingFindCompletedItems: jest.Mock;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();

    // Get the mocked instance and its methods
    mockEbayApiInstance = new (eBayApi as any)();
    mockBuyBrowseSearch = mockEbayApiInstance.buy.browse.search;
    mockFindingFindCompletedItems = mockEbayApiInstance.finding.findCompletedItems;

    // Default mock implementations
    mockBuyBrowseSearch.mockResolvedValue({ itemSummaries: [] });
    mockFindingFindCompletedItems.mockResolvedValue({ ack: 'Success', searchResult: { item: [] } });
  });

  it('should call buy.browse.search for ACTIVE config', async () => {
    await searchItemsByKeyword('test-keyword', 'ACTIVE');

    expect(mockBuyBrowseSearch).toHaveBeenCalledTimes(1);
    expect(mockFindingFindCompletedItems).not.toHaveBeenCalled();
    expect(mockBuyBrowseSearch).toHaveBeenCalledWith(expect.objectContaining({
      filter: 'buyingOptions:{FIXED_PRICE}',
    }));
  });

  it('should call finding.findCompletedItems for SOLD config', async () => {
    await searchItemsByKeyword('test-keyword', 'SOLD');

    expect(mockFindingFindCompletedItems).toHaveBeenCalledTimes(1);
    expect(mockBuyBrowseSearch).not.toHaveBeenCalled();
    expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({
      itemFilter: expect.arrayContaining([
        { name: 'SoldItemsOnly', value: true },
      ]),
    }));
  });

  it('should call finding.findCompletedItems for ENDED config', async () => {
    await searchItemsByKeyword('test-keyword', 'ENDED');

    expect(mockFindingFindCompletedItems).toHaveBeenCalledTimes(1);
    expect(mockBuyBrowseSearch).not.toHaveBeenCalled();
    expect(mockFindingFindCompletedItems).toHaveBeenCalledWith(expect.objectContaining({
      itemFilter: expect.arrayContaining([
        { name: 'SoldItemsOnly', value: false },
      ]),
    }));
  });

  it('should throw an error for an invalid config key', async () => {
    // We expect the function to throw, so we wrap it in a try-catch or use .toThrow()
    await expect(searchItemsByKeyword('test-keyword', 'INVALID_KEY')).rejects.toThrow(
      'Invalid eBay search config key: INVALID_KEY'
    );
  });
});
