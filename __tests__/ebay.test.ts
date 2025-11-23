import { findItem } from '../src/ebay';
import { searchItemsByKeyword } from '../src/ebayApi';
import { EbayItem } from '../src/types/ebay-api';

jest.mock('../src/ebayApi');

const mockSearchItemsByKeyword = searchItemsByKeyword as jest.Mock;

describe('ebay.ts', () => {
  beforeEach(() => {
    mockSearchItemsByKeyword.mockClear();
  });

  it('should return item details for a single part number on successful API response', async () => {
    const mockEbayItem: EbayItem = {
      itemId: '123',
      title: 'Genuine OEM Part',
      price: { value: '42.00', currency: 'USD' },
    };
    // searchItemsByKeyword returns EbayItem[][], so for one keyword, it's [[item]]
    mockSearchItemsByKeyword.mockResolvedValueOnce([[mockEbayItem]]);

    const results = await findItem(['any-part'], 'SOLD');

    expect(mockSearchItemsByKeyword).toHaveBeenCalledTimes(1);
    expect(mockSearchItemsByKeyword).toHaveBeenCalledWith(['any-part'], 'SOLD');
    expect(results).toEqual([
      {
        partNumber: 'any-part',
        result: { title: 'Genuine OEM Part', price: '42.00 USD' },
      },
    ]);
  });

  it('should return null result for a single part number if API finds no items', async () => {
    // searchItemsByKeyword returns EbayItem[][], so for one keyword with no results, it's [[]]
    mockSearchItemsByKeyword.mockResolvedValueOnce([[]]);

    const results = await findItem(['non-existent-part'], 'SOLD');

    expect(mockSearchItemsByKeyword).toHaveBeenCalledTimes(1);
    expect(mockSearchItemsByKeyword).toHaveBeenCalledWith(['non-existent-part'], 'SOLD');
    expect(results).toEqual([
      {
        partNumber: 'non-existent-part',
        result: null,
      },
    ]);
  });

  it('should handle API failure gracefully for a single part number', async () => {
    // searchItemsByKeyword now handles errors by returning empty arrays for affected keywords
    mockSearchItemsByKeyword.mockResolvedValueOnce([[]]); // Simulate error handled by ebayApi.ts

    const results = await findItem(['error-part'], 'SOLD');

    expect(mockSearchItemsByKeyword).toHaveBeenCalledTimes(1);
    expect(mockSearchItemsByKeyword).toHaveBeenCalledWith(['error-part'], 'SOLD');
    expect(results).toEqual([
      {
        partNumber: 'error-part',
        result: null,
      },
    ]);
  });

  it('should throw an error on API failure', async () => {
    const apiError = new Error('eBay API Error from searchItemsByKeyword');
    mockSearchItemsByKeyword.mockRejectedValueOnce(apiError);

    await expect(findItem(['part-with-api-error'], 'SOLD')).rejects.toThrow(apiError);
  });

  it('should handle multiple part numbers and return mixed results', async () => {
    const mockItem1: EbayItem = {
      itemId: '1',
      title: 'Part 1 Found',
      price: { value: '10.00', currency: 'USD' },
    };
    const mockItem2: EbayItem = {
      itemId: '2',
      title: 'Part 2 Found',
      price: { value: '20.00', currency: 'EUR' },
    };

    // Simulate results for ['part1', 'part2', 'no-result-part', 'error-part']
    mockSearchItemsByKeyword.mockResolvedValueOnce([
      [mockItem1], // Result for part1
      [mockItem2], // Result for part2
      [],          // No result for no-result-part
      [],          // Error handled by ebayApi.ts for error-part
    ]);

    const partNumbers = ['part1', 'part2', 'no-result-part', 'error-part'];
    const results = await findItem(partNumbers, 'ACTIVE');

    expect(mockSearchItemsByKeyword).toHaveBeenCalledTimes(1);
    expect(mockSearchItemsByKeyword).toHaveBeenCalledWith(partNumbers, 'ACTIVE');
    expect(results).toEqual([
      {
        partNumber: 'part1',
        result: { title: 'Part 1 Found', price: '10.00 USD' },
      },
      {
        partNumber: 'part2',
        result: { title: 'Part 2 Found', price: '20.00 EUR' },
      },
      {
        partNumber: 'no-result-part',
        result: null,
      },
      {
        partNumber: 'error-part',
        result: null,
      },
    ]);
  });
});
