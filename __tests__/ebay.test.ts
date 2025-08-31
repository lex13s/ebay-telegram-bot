
import { findItem } from '../src/ebay';
import eBayApi from 'ebay-api';

// Mock the entire 'ebay-api' module
jest.mock('ebay-api');

// We will control the mock for the .search() method in each test
const mockSearch = jest.fn();

// Mock the constructor of eBayApi to return an object
// that has the methods our code uses.
(eBayApi as jest.Mock).mockImplementation(() => {
  return {
    buy: {
      browse: {
        search: mockSearch,
      },
    },
    OAuth2: {
      setCredentials: jest.fn(),
    },
  };
});

describe('ebay.ts', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear mock history before each test
    mockSearch.mockClear();
    (eBayApi as jest.Mock).mockClear();
    // Spy on console.error to keep test output clean
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return mock data when authToken is not provided', async () => {
    const item = await findItem('any-part', undefined as any);
    expect(mockSearch).not.toHaveBeenCalled();
    expect(item).not.toBeNull();
    expect(item!.title).toBe('Mock Item for any-part');
  });

  it('should return item details on successful API response', async () => {
    const mockItem = {
      title: 'Genuine OEM Part',
      price: { value: '42.00', currency: 'USD' },
    };
    mockSearch.mockResolvedValue({ itemSummaries: [mockItem] });

    const item = await findItem('any-part', 'FAKE_OAUTH_TOKEN');

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(item).toEqual({ title: 'Genuine OEM Part', price: '42.00 USD' });
  });

  it('should return null if API finds no items', async () => {
    mockSearch.mockResolvedValue({ itemSummaries: [] });

    const item = await findItem('non-existent-part', 'FAKE_OAUTH_TOKEN');

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(item).toBeNull();
  });

  it('should return null and log an error on API failure', async () => {
    const apiError = new Error('eBay API Error');
    mockSearch.mockRejectedValue(apiError);

    const item = await findItem('any-part', 'FAKE_OAUTH_TOKEN');

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(item).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error searching on eBay:', apiError);
  });
});
