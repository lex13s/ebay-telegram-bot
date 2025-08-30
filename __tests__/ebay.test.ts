
import { findItem } from '../src/ebay';

// Mock global fetch
global.fetch = jest.fn();

describe('ebay.ts', () => {

    beforeEach(() => {
        (fetch as jest.Mock).mockClear();
    });

    it('should return mock data when appId is not provided', async () => {
        const partNumber = 'test-part-123';
        const item = await findItem(partNumber, 'YOUR_EBAY_APP_ID_HERE');

        expect(fetch).not.toHaveBeenCalled();
        expect(item).not.toBeNull();
        expect(item!.title).toBe(`Mock Item for ${partNumber}`);
        expect(item).toHaveProperty('price');
    });

    it('should parse a successful API response correctly', async () => {
        const mockResponse = {
            findItemsByKeywordsResponse: [
                {
                    searchResult: [
                        {
                            item: [
                                {
                                    title: ['Genuine OEM Part'],
                                    sellingStatus: [
                                        {
                                            currentPrice: [
                                                { __value__: '42.00' }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const item = await findItem('any-part', 'FAKE_APP_ID');

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(item).not.toBeNull();
        expect(item!.title).toBe('Genuine OEM Part');
        expect(item!.price).toBe('42.00');
    });

    it('should return null if API returns no items', async () => {
        const mockResponse = {
            findItemsByKeywordsResponse: [
                {
                    searchResult: [
                        { item: [] } // No items found
                    ]
                }
            ]
        };

        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const item = await findItem('non-existent-part', 'FAKE_APP_ID');

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(item).toBeNull();
    });

    it('should return null on API error (fetch throws)', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

        const item = await findItem('any-part', 'FAKE_APP_ID');

        expect(item).toBeNull();
    });

    it('should return null on non-ok response', async () => {
        (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('Server Error') });

        const item = await findItem('any-part', 'FAKE_APP_ID');

        expect(item).toBeNull();
    });
});
