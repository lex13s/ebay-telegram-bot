"use strict";
/**
 * Tests for EbaySearchService
 */
Object.defineProperty(exports, "__esModule", { value: true });
const EbaySearchService_1 = require("../../../src/application/services/EbaySearchService");
const PartNumber_1 = require("../../../src/domain/value-objects/PartNumber");
const SearchConfigKey_1 = require("../../../src/domain/value-objects/SearchConfigKey");
describe('Application Layer - Service: EbaySearchService', () => {
    let ebaySearchService;
    let mockBrowseClient;
    let mockFindingClient;
    let mockLogger;
    beforeEach(() => {
        mockBrowseClient = {
            searchActiveItems: jest.fn(),
        };
        mockFindingClient = {
            searchCompletedItems: jest.fn(),
        };
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
        ebaySearchService = new EbaySearchService_1.EbaySearchService(mockBrowseClient, mockFindingClient, mockLogger);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('search - ACTIVE config (Browse API)', () => {
        it('should search using Browse API for ACTIVE config', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('PART-001')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockResolvedValue([
                {
                    itemId: 'ITEM-123',
                    title: 'Test Item',
                    priceValue: '99.99',
                    priceCurrency: 'USD',
                },
            ]);
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(1);
            expect(results[0].isFound()).toBe(true);
            expect(results[0].getTitle()).toBe('Test Item');
            expect(results[0].getPrice()).toBe('99.99 USD');
            expect(mockBrowseClient.searchActiveItems).toHaveBeenCalledWith('PART-001', expect.any(Object));
            expect(mockFindingClient.searchCompletedItems).not.toHaveBeenCalled();
        });
        it('should handle multiple part numbers with ACTIVE config', async () => {
            // Arrange
            const partNumbers = [
                PartNumber_1.PartNumber.create('PART-001'),
                PartNumber_1.PartNumber.create('PART-002'),
                PartNumber_1.PartNumber.create('PART-003'),
            ];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockImplementation(async (keyword) => {
                return [
                    {
                        itemId: `ITEM-${keyword}`,
                        title: `Item for ${keyword}`,
                        priceValue: '50.00',
                        priceCurrency: 'USD',
                    },
                ];
            });
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(3);
            expect(results.every((r) => r.isFound())).toBe(true);
            expect(mockBrowseClient.searchActiveItems).toHaveBeenCalledTimes(3);
        });
        it('should return not found result when Browse API returns empty array', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('NOT-FOUND')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockResolvedValue([]);
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(1);
            expect(results[0].isFound()).toBe(false);
            expect(results[0].getTitle()).toBe('Not Found');
            expect(results[0].getPrice()).toBe('N/A');
        });
    });
    describe('search - SOLD config (Finding API)', () => {
        it('should search using Finding API for SOLD config', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('SOLD-PART')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            mockFindingClient.searchCompletedItems.mockResolvedValue([
                {
                    itemId: 'SOLD-ITEM-456',
                    title: 'Sold Item',
                    priceValue: '149.99',
                    priceCurrency: 'USD',
                },
            ]);
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(1);
            expect(results[0].isFound()).toBe(true);
            expect(results[0].getTitle()).toBe('Sold Item');
            expect(results[0].getPrice()).toBe('149.99 USD');
            expect(mockFindingClient.searchCompletedItems).toHaveBeenCalledWith('SOLD-PART', expect.any(Object));
            expect(mockBrowseClient.searchActiveItems).not.toHaveBeenCalled();
        });
        it('should handle multiple part numbers with SOLD config', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('SOLD-001'), PartNumber_1.PartNumber.create('SOLD-002')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            mockFindingClient.searchCompletedItems.mockImplementation(async (keyword) => {
                return [
                    {
                        itemId: `SOLD-${keyword}`,
                        title: `Sold ${keyword}`,
                        priceValue: '25.50',
                        priceCurrency: 'USD',
                    },
                ];
            });
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(2);
            expect(results.every((r) => r.isFound())).toBe(true);
            expect(mockFindingClient.searchCompletedItems).toHaveBeenCalledTimes(2);
        });
        it('should return not found result when Finding API returns empty array', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('NO-SOLD')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            mockFindingClient.searchCompletedItems.mockResolvedValue([]);
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(1);
            expect(results[0].isFound()).toBe(false);
        });
    });
    describe('search - ENDED config (Finding API)', () => {
        it('should search using Finding API for ENDED config', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('ENDED-PART')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ENDED');
            mockFindingClient.searchCompletedItems.mockResolvedValue([
                {
                    itemId: 'ENDED-ITEM-789',
                    title: 'Ended Item',
                    priceValue: '199.00',
                    priceCurrency: 'USD',
                },
            ]);
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(1);
            expect(results[0].isFound()).toBe(true);
            expect(results[0].getTitle()).toBe('Ended Item');
            expect(mockFindingClient.searchCompletedItems).toHaveBeenCalled();
            expect(mockBrowseClient.searchActiveItems).not.toHaveBeenCalled();
        });
    });
    describe('search - mixed results', () => {
        it('should handle mix of found and not found items', async () => {
            // Arrange
            const partNumbers = [
                PartNumber_1.PartNumber.create('FOUND-1'),
                PartNumber_1.PartNumber.create('NOT-FOUND'),
                PartNumber_1.PartNumber.create('FOUND-2'),
            ];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockImplementation(async (keyword) => {
                if (keyword === 'NOT-FOUND') {
                    return [];
                }
                return [
                    {
                        itemId: `ITEM-${keyword}`,
                        title: `Found ${keyword}`,
                        priceValue: '100.00',
                        priceCurrency: 'USD',
                    },
                ];
            });
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(3);
            expect(results[0].isFound()).toBe(true);
            expect(results[1].isFound()).toBe(false);
            expect(results[2].isFound()).toBe(true);
        });
    });
    describe('search - parallel execution', () => {
        it('should execute searches in parallel', async () => {
            // Arrange
            const partNumbers = [
                PartNumber_1.PartNumber.create('PART-1'),
                PartNumber_1.PartNumber.create('PART-2'),
                PartNumber_1.PartNumber.create('PART-3'),
                PartNumber_1.PartNumber.create('PART-4'),
                PartNumber_1.PartNumber.create('PART-5'),
            ];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            let callCount = 0;
            mockBrowseClient.searchActiveItems.mockImplementation(async () => {
                callCount++;
                await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
                return [
                    {
                        itemId: `ITEM-${callCount}`,
                        title: `Item ${callCount}`,
                        priceValue: '50.00',
                        priceCurrency: 'USD',
                    },
                ];
            });
            // Act
            const startTime = Date.now();
            const results = await ebaySearchService.search(partNumbers, configKey);
            const duration = Date.now() - startTime;
            // Assert
            expect(results).toHaveLength(5);
            expect(results.every((r) => r.isFound())).toBe(true);
            // If truly parallel, should be much less than 5 * 10ms = 50ms
            expect(duration).toBeLessThan(40);
        });
    });
    describe('search - error handling', () => {
        it('should propagate error from Browse API', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('ERROR-PART')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockRejectedValue(new Error('eBay API Error'));
            // Act & Assert
            await expect(ebaySearchService.search(partNumbers, configKey)).rejects.toThrow('eBay API Error');
        });
        it('should propagate error from Finding API', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('ERROR-PART')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            mockFindingClient.searchCompletedItems.mockRejectedValue(new Error('Finding API Error'));
            // Act & Assert
            await expect(ebaySearchService.search(partNumbers, configKey)).rejects.toThrow('Finding API Error');
        });
        it('should fail all searches if one fails', async () => {
            // Arrange
            const partNumbers = [
                PartNumber_1.PartNumber.create('GOOD-1'),
                PartNumber_1.PartNumber.create('ERROR'),
                PartNumber_1.PartNumber.create('GOOD-2'),
            ];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockImplementation(async (keyword) => {
                if (keyword === 'ERROR') {
                    throw new Error('API Error');
                }
                return [
                    {
                        itemId: 'ITEM-123',
                        title: 'Good Item',
                        priceValue: '50.00',
                        priceCurrency: 'USD',
                    },
                ];
            });
            // Act & Assert
            await expect(ebaySearchService.search(partNumbers, configKey)).rejects.toThrow('API Error');
        });
    });
    describe('search - logging', () => {
        it('should log at start of search', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('PART-1'), PartNumber_1.PartNumber.create('PART-2')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockResolvedValue([
                {
                    itemId: 'ITEM-123',
                    title: 'Item',
                    priceValue: '50.00',
                    priceCurrency: 'USD',
                },
            ]);
            // Act
            await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith('Starting eBay search', {
                partNumbersCount: 2,
                configKey: 'ACTIVE',
            });
        });
        it('should log at completion of search', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('PART-1'), PartNumber_1.PartNumber.create('PART-2')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockImplementation(async (keyword) => {
                if (keyword === 'PART-1') {
                    return [
                        {
                            itemId: 'ITEM-1',
                            title: 'Found',
                            priceValue: '50.00',
                            priceCurrency: 'USD',
                        },
                    ];
                }
                return []; // Not found for PART-2
            });
            // Act
            await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith('eBay search completed', {
                totalResults: 2,
                foundItems: 1,
            });
        });
    });
    describe('search - edge cases', () => {
        it('should handle empty part numbers array', async () => {
            // Arrange
            const partNumbers = [];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(0);
            expect(mockBrowseClient.searchActiveItems).not.toHaveBeenCalled();
            expect(mockFindingClient.searchCompletedItems).not.toHaveBeenCalled();
        });
        it('should handle single part number', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('SINGLE')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            mockFindingClient.searchCompletedItems.mockResolvedValue([
                {
                    itemId: 'SINGLE-ITEM',
                    title: 'Single Item',
                    priceValue: '25.00',
                    priceCurrency: 'USD',
                },
            ]);
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(1);
            expect(results[0].isFound()).toBe(true);
        });
        it('should use first item when API returns multiple items', async () => {
            // Arrange
            const partNumbers = [PartNumber_1.PartNumber.create('MULTI')];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockResolvedValue([
                {
                    itemId: 'FIRST-ITEM',
                    title: 'First Item',
                    priceValue: '100.00',
                    priceCurrency: 'USD',
                },
                {
                    itemId: 'SECOND-ITEM',
                    title: 'Second Item',
                    priceValue: '200.00',
                    priceCurrency: 'USD',
                },
            ]);
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(1);
            expect(results[0].getData()?.itemId).toBe('FIRST-ITEM');
            expect(results[0].getTitle()).toBe('First Item');
        });
    });
    describe('search - different currencies', () => {
        it('should handle different price currencies', async () => {
            // Arrange
            const partNumbers = [
                PartNumber_1.PartNumber.create('USD-ITEM'),
                PartNumber_1.PartNumber.create('EUR-ITEM'),
                PartNumber_1.PartNumber.create('GBP-ITEM'),
            ];
            const configKey = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            mockBrowseClient.searchActiveItems.mockImplementation(async (keyword) => {
                const currencyMap = {
                    'USD-ITEM': 'USD',
                    'EUR-ITEM': 'EUR',
                    'GBP-ITEM': 'GBP',
                };
                return [
                    {
                        itemId: `ITEM-${keyword}`,
                        title: `Item in ${currencyMap[keyword]}`,
                        priceValue: '100.00',
                        priceCurrency: currencyMap[keyword],
                    },
                ];
            });
            // Act
            const results = await ebaySearchService.search(partNumbers, configKey);
            // Assert
            expect(results).toHaveLength(3);
            expect(results[0].getPrice()).toBe('100.00 USD');
            expect(results[1].getPrice()).toBe('100.00 EUR');
            expect(results[2].getPrice()).toBe('100.00 GBP');
        });
    });
});
