"use strict";
/**
 * Tests for Entity: SearchResult
 */
Object.defineProperty(exports, "__esModule", { value: true });
const SearchResult_1 = require("../../src/domain/entities/SearchResult");
const PartNumber_1 = require("../../src/domain/value-objects/PartNumber");
describe('Domain Layer - Entity: SearchResult', () => {
    describe('createFound', () => {
        it('should create found result with valid data', () => {
            const partNumber = PartNumber_1.PartNumber.create('PART-123');
            const data = {
                itemId: 'ITEM-456',
                title: 'Test Item',
                priceValue: '99.99',
                priceCurrency: 'USD',
            };
            const result = SearchResult_1.SearchResult.createFound(partNumber, data);
            expect(result.isFound()).toBe(true);
            expect(result.getPartNumber().getValue()).toBe('PART-123');
            expect(result.getData()).toEqual(data);
            expect(result.getTitle()).toBe('Test Item');
            expect(result.getPrice()).toBe('99.99 USD');
        });
        it('should store all data properties correctly', () => {
            const partNumber = PartNumber_1.PartNumber.create('TEST-PART');
            const data = {
                itemId: 'EBAY-123456',
                title: 'Amazing Product',
                priceValue: '1234.56',
                priceCurrency: 'EUR',
            };
            const result = SearchResult_1.SearchResult.createFound(partNumber, data);
            expect(result.getData()?.itemId).toBe('EBAY-123456');
            expect(result.getData()?.title).toBe('Amazing Product');
            expect(result.getData()?.priceValue).toBe('1234.56');
            expect(result.getData()?.priceCurrency).toBe('EUR');
        });
    });
    describe('createNotFound', () => {
        it('should create not found result', () => {
            const partNumber = PartNumber_1.PartNumber.create('NOT-FOUND-123');
            const result = SearchResult_1.SearchResult.createNotFound(partNumber);
            expect(result.isFound()).toBe(false);
            expect(result.getPartNumber().getValue()).toBe('NOT-FOUND-123');
            expect(result.getData()).toBeNull();
        });
        it('should return default values for not found result', () => {
            const partNumber = PartNumber_1.PartNumber.create('MISSING');
            const result = SearchResult_1.SearchResult.createNotFound(partNumber);
            expect(result.getTitle()).toBe('Not Found');
            expect(result.getPrice()).toBe('N/A');
        });
    });
    describe('getTitle', () => {
        it('should return title for found result', () => {
            const partNumber = PartNumber_1.PartNumber.create('PART-1');
            const data = {
                itemId: 'ITEM-1',
                title: 'Awesome Product',
                priceValue: '50.00',
                priceCurrency: 'USD',
            };
            const result = SearchResult_1.SearchResult.createFound(partNumber, data);
            expect(result.getTitle()).toBe('Awesome Product');
        });
        it('should return "Not Found" for not found result', () => {
            const partNumber = PartNumber_1.PartNumber.create('MISSING');
            const result = SearchResult_1.SearchResult.createNotFound(partNumber);
            expect(result.getTitle()).toBe('Not Found');
        });
    });
    describe('getPrice', () => {
        it('should format price with currency for found result', () => {
            const partNumber = PartNumber_1.PartNumber.create('PART-1');
            const data = {
                itemId: 'ITEM-1',
                title: 'Product',
                priceValue: '123.45',
                priceCurrency: 'USD',
            };
            const result = SearchResult_1.SearchResult.createFound(partNumber, data);
            expect(result.getPrice()).toBe('123.45 USD');
        });
        it('should handle different currencies', () => {
            const testCases = [
                { priceValue: '100.00', priceCurrency: 'EUR', expected: '100.00 EUR' },
                { priceValue: '50.99', priceCurrency: 'GBP', expected: '50.99 GBP' },
                { priceValue: '250.00', priceCurrency: 'CAD', expected: '250.00 CAD' },
            ];
            testCases.forEach(({ priceValue, priceCurrency, expected }) => {
                const data = {
                    itemId: 'ITEM-1',
                    title: 'Product',
                    priceValue,
                    priceCurrency,
                };
                const result = SearchResult_1.SearchResult.createFound(PartNumber_1.PartNumber.create('TEST'), data);
                expect(result.getPrice()).toBe(expected);
            });
        });
        it('should return "N/A" for not found result', () => {
            const partNumber = PartNumber_1.PartNumber.create('MISSING');
            const result = SearchResult_1.SearchResult.createNotFound(partNumber);
            expect(result.getPrice()).toBe('N/A');
        });
    });
    describe('isFound', () => {
        it('should return true for found result', () => {
            const data = {
                itemId: 'ITEM-1',
                title: 'Product',
                priceValue: '99.99',
                priceCurrency: 'USD',
            };
            const result = SearchResult_1.SearchResult.createFound(PartNumber_1.PartNumber.create('TEST'), data);
            expect(result.isFound()).toBe(true);
        });
        it('should return false for not found result', () => {
            const result = SearchResult_1.SearchResult.createNotFound(PartNumber_1.PartNumber.create('TEST'));
            expect(result.isFound()).toBe(false);
        });
    });
    describe('getPartNumber', () => {
        it('should return part number for found result', () => {
            const partNumber = PartNumber_1.PartNumber.create('MY-PART-123');
            const data = {
                itemId: 'ITEM-1',
                title: 'Product',
                priceValue: '99.99',
                priceCurrency: 'USD',
            };
            const result = SearchResult_1.SearchResult.createFound(partNumber, data);
            expect(result.getPartNumber()).toBe(partNumber);
            expect(result.getPartNumber().getValue()).toBe('MY-PART-123');
        });
        it('should return part number for not found result', () => {
            const partNumber = PartNumber_1.PartNumber.create('MISSING-PART');
            const result = SearchResult_1.SearchResult.createNotFound(partNumber);
            expect(result.getPartNumber()).toBe(partNumber);
            expect(result.getPartNumber().getValue()).toBe('MISSING-PART');
        });
    });
    describe('getData', () => {
        it('should return data for found result', () => {
            const data = {
                itemId: 'ITEM-123',
                title: 'Test Product',
                priceValue: '150.00',
                priceCurrency: 'USD',
            };
            const result = SearchResult_1.SearchResult.createFound(PartNumber_1.PartNumber.create('TEST'), data);
            expect(result.getData()).toEqual(data);
            expect(result.getData()).not.toBeNull();
        });
        it('should return null for not found result', () => {
            const result = SearchResult_1.SearchResult.createNotFound(PartNumber_1.PartNumber.create('TEST'));
            expect(result.getData()).toBeNull();
        });
    });
    describe('edge cases', () => {
        it('should handle empty title (defaults to Not Found)', () => {
            const data = {
                itemId: 'ITEM-1',
                title: '',
                priceValue: '99.99',
                priceCurrency: 'USD',
            };
            const result = SearchResult_1.SearchResult.createFound(PartNumber_1.PartNumber.create('TEST'), data);
            // Empty string is falsy, so getTitle() returns 'Not Found'
            expect(result.getTitle()).toBe('Not Found');
        });
        it('should handle zero price', () => {
            const data = {
                itemId: 'ITEM-1',
                title: 'Free Item',
                priceValue: '0.00',
                priceCurrency: 'USD',
            };
            const result = SearchResult_1.SearchResult.createFound(PartNumber_1.PartNumber.create('TEST'), data);
            expect(result.getPrice()).toBe('0.00 USD');
        });
        it('should handle special characters in title', () => {
            const data = {
                itemId: 'ITEM-1',
                title: 'Product™ with "quotes" & symbols!',
                priceValue: '99.99',
                priceCurrency: 'USD',
            };
            const result = SearchResult_1.SearchResult.createFound(PartNumber_1.PartNumber.create('TEST'), data);
            expect(result.getTitle()).toBe('Product™ with "quotes" & symbols!');
        });
    });
});
