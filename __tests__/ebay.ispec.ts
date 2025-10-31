import { findItem } from '../src/ebay';
import { searchItemsByKeyword } from '../src/ebayApi';

jest.mock('../src/ebayApi');

const mockSearchItemsByKeyword = searchItemsByKeyword as jest.Mock;

describe('ebay.ts', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSearchItemsByKeyword.mockClear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return item details on successful API response', async () => {
    const mockItem = {
      title: 'Genuine OEM Part',
      price: { value: '42.00', currency: 'USD' },
    };
    mockSearchItemsByKeyword.mockResolvedValue([mockItem]);

    const item = await findItem('any-part', 'SOLD'); // Ensure configKey is provided

    expect(mockSearchItemsByKeyword).toHaveBeenCalledTimes(1);
    expect(item).toEqual({ title: 'Genuine OEM Part', price: '42.00 USD' });
  });

  it('should return null if API finds no items', async () => {
    mockSearchItemsByKeyword.mockResolvedValue([]);

    const item = await findItem('non-existent-part', 'SOLD'); // Ensure configKey is provided

    expect(mockSearchItemsByKeyword).toHaveBeenCalledTimes(1);
    expect(item).toBeNull();
  });

  it('should throw an error on API failure', async () => {
    const apiError = new Error('eBay API Error');
    mockSearchItemsByKeyword.mockRejectedValue(apiError);

    await expect(findItem('any-part', 'SOLD')).rejects.toThrow(apiError); // Ensure configKey is provided

    expect(mockSearchItemsByKeyword).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error searching on eBay:', apiError);
  });
});
