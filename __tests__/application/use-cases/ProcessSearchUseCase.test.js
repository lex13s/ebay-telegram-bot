"use strict";
/**
 * Tests for ProcessSearchUseCase
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ProcessSearchUseCase_1 = require("../../../src/application/use-cases/ProcessSearchUseCase");
const UserId_1 = require("../../../src/domain/value-objects/UserId");
const Balance_1 = require("../../../src/domain/value-objects/Balance");
const PartNumber_1 = require("../../../src/domain/value-objects/PartNumber");
const DomainErrors_1 = require("../../../src/domain/errors/DomainErrors");
const MockFactory_1 = require("../../helpers/MockFactory");
describe('Application Layer - Use Case: ProcessSearchUseCase', () => {
    let useCase;
    let mockUserService;
    let mockEbaySearchService;
    let mockLogger;
    let costPerRequest;
    beforeEach(() => {
        // Setup mocks
        mockUserService = {
            getOrCreateUser: jest.fn(),
            saveUser: jest.fn(),
            getUserById: jest.fn(),
            addBalance: jest.fn(),
            deductBalance: jest.fn(),
            updateSearchConfig: jest.fn(),
        };
        mockEbaySearchService = {
            search: jest.fn(),
        };
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
        costPerRequest = Balance_1.Balance.fromDollars(2); // $2 per request
        useCase = new ProcessSearchUseCase_1.ProcessSearchUseCase(mockUserService, mockEbaySearchService, costPerRequest, mockLogger);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('execute - successful search', () => {
        it('should process search successfully with results', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const partNumbers = [PartNumber_1.PartNumber.create('PART-001'), PartNumber_1.PartNumber.create('PART-002')];
            const user = MockFactory_1.MockFactory.createUser({
                id: 123456,
                balanceCents: 10000, // $100
            });
            const searchResults = [
                MockFactory_1.MockFactory.createSearchResult({ partNumber: 'PART-001' }),
                MockFactory_1.MockFactory.createSearchResult({ partNumber: 'PART-002' }),
            ];
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockEbaySearchService.search.mockResolvedValue(searchResults);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'testuser',
                partNumbers,
                isAdmin: false,
            });
            // Assert
            expect(result.results).toEqual(searchResults);
            expect(result.cost.getCents()).toBe(400); // 2 parts * $2 = $4
            expect(result.newBalance.getCents()).toBe(9600); // $100 - $4 = $96
            expect(result.refunded).toBe(false);
            expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith(userId, 'testuser');
            expect(mockUserService.saveUser).toHaveBeenCalledTimes(1);
            expect(mockEbaySearchService.search).toHaveBeenCalledWith(partNumbers, user.getSearchConfigKey());
            expect(mockLogger.info).toHaveBeenCalledWith('Search completed successfully', expect.any(Object));
        });
        it('should handle single part number search', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const partNumbers = [PartNumber_1.PartNumber.create('SINGLE-PART')];
            const user = MockFactory_1.MockFactory.createUser({ balanceCents: 5000 });
            const searchResults = [MockFactory_1.MockFactory.createSearchResult({ partNumber: 'SINGLE-PART' })];
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockEbaySearchService.search.mockResolvedValue(searchResults);
            // Act
            const result = await useCase.execute({
                userId,
                username: null,
                partNumbers,
                isAdmin: false,
            });
            // Assert
            expect(result.cost.getCents()).toBe(200); // 1 part * $2 = $2
            expect(result.newBalance.getCents()).toBe(4800); // $50 - $2 = $48
            expect(result.refunded).toBe(false);
        });
    });
    describe('execute - admin user', () => {
        it('should process search for admin without charging', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(999);
            const partNumbers = [PartNumber_1.PartNumber.create('ADMIN-PART')];
            const user = MockFactory_1.MockFactory.createUser({ id: 999, balanceCents: 5000 });
            const searchResults = [MockFactory_1.MockFactory.createSearchResult({ partNumber: 'ADMIN-PART' })];
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockEbaySearchService.search.mockResolvedValue(searchResults);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'admin',
                partNumbers,
                isAdmin: true,
            });
            // Assert
            expect(result.cost.getCents()).toBe(0); // Admin pays nothing
            expect(result.newBalance.getCents()).toBe(5000); // Balance unchanged
            expect(result.refunded).toBe(false);
            // User service save should NOT be called for admin (no balance deduction)
            expect(mockUserService.saveUser).not.toHaveBeenCalled();
            expect(mockEbaySearchService.search).toHaveBeenCalled();
        });
        it('should allow admin search even with zero balance', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(999);
            const partNumbers = [PartNumber_1.PartNumber.create('PART-1'), PartNumber_1.PartNumber.create('PART-2')];
            const user = MockFactory_1.MockFactory.createUser({ id: 999, balanceCents: 0 });
            const searchResults = [
                MockFactory_1.MockFactory.createSearchResult({ partNumber: 'PART-1' }),
                MockFactory_1.MockFactory.createSearchResult({ partNumber: 'PART-2' }),
            ];
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockEbaySearchService.search.mockResolvedValue(searchResults);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'admin',
                partNumbers,
                isAdmin: true,
            });
            // Assert
            expect(result.cost.getCents()).toBe(0);
            expect(result.newBalance.getCents()).toBe(0);
            expect(result.results).toHaveLength(2);
        });
    });
    describe('execute - insufficient funds', () => {
        it('should throw InsufficientFundsError when balance is too low', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const partNumbers = [
                PartNumber_1.PartNumber.create('PART-1'),
                PartNumber_1.PartNumber.create('PART-2'),
                PartNumber_1.PartNumber.create('PART-3'),
            ];
            const user = MockFactory_1.MockFactory.createUser({
                balanceCents: 100, // Only $1, need $6 (3 * $2)
            });
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            // Act & Assert
            await expect(useCase.execute({
                userId,
                username: 'pooruser',
                partNumbers,
                isAdmin: false,
            })).rejects.toThrow(DomainErrors_1.InsufficientFundsError);
            // Should NOT call save or search if insufficient funds
            expect(mockUserService.saveUser).not.toHaveBeenCalled();
            expect(mockEbaySearchService.search).not.toHaveBeenCalled();
            expect(mockLogger.warn).toHaveBeenCalledWith('Insufficient funds', expect.any(Object));
        });
        it('should throw when balance is exactly one cent short', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const partNumbers = [PartNumber_1.PartNumber.create('PART')];
            const user = MockFactory_1.MockFactory.createUser({
                balanceCents: 199, // $1.99, need $2.00
            });
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            // Act & Assert
            await expect(useCase.execute({
                userId,
                username: 'user',
                partNumbers,
                isAdmin: false,
            })).rejects.toThrow(DomainErrors_1.InsufficientFundsError);
        });
    });
    describe('execute - no results found (refund)', () => {
        it('should refund when no results are found', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const partNumbers = [PartNumber_1.PartNumber.create('NOT-FOUND')];
            const user = MockFactory_1.MockFactory.createUser({ balanceCents: 10000 });
            // SearchResult with isFound() = false
            const emptyResults = [MockFactory_1.MockFactory.createSearchResultNotFound('NOT-FOUND')];
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockEbaySearchService.search.mockResolvedValue(emptyResults);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'testuser',
                partNumbers,
                isAdmin: false,
            });
            // Assert
            expect(result.refunded).toBe(true);
            expect(result.newBalance.getCents()).toBe(10000); // Refunded back to original
            expect(result.cost.getCents()).toBe(200);
            // Should save twice: once for deduction, once for refund
            expect(mockUserService.saveUser).toHaveBeenCalledTimes(2);
            expect(mockLogger.info).toHaveBeenCalledWith('Search completed with no results - refunded', expect.any(Object));
        });
        it('should NOT refund for admin even with no results', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(999);
            const partNumbers = [PartNumber_1.PartNumber.create('NOT-FOUND')];
            const user = MockFactory_1.MockFactory.createUser({ id: 999, balanceCents: 5000 });
            const emptyResults = [MockFactory_1.MockFactory.createSearchResultNotFound('NOT-FOUND')];
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockEbaySearchService.search.mockResolvedValue(emptyResults);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'admin',
                partNumbers,
                isAdmin: true,
            });
            // Assert
            expect(result.refunded).toBe(false);
            expect(result.newBalance.getCents()).toBe(5000);
            expect(mockUserService.saveUser).not.toHaveBeenCalled();
        });
    });
    describe('execute - search error (refund)', () => {
        it('should refund when search throws error', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const partNumbers = [PartNumber_1.PartNumber.create('ERROR-PART')];
            const user = MockFactory_1.MockFactory.createUser({ balanceCents: 10000 });
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockEbaySearchService.search.mockRejectedValue(new Error('eBay API Error'));
            // Act & Assert
            await expect(useCase.execute({
                userId,
                username: 'testuser',
                partNumbers,
                isAdmin: false,
            })).rejects.toThrow('eBay API Error');
            // Should save twice: once for deduction, once for refund
            expect(mockUserService.saveUser).toHaveBeenCalledTimes(2);
            expect(mockLogger.error).toHaveBeenCalledWith('Search failed - refunded', expect.any(Error), expect.any(Object));
        });
        it('should NOT refund admin on search error', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(999);
            const partNumbers = [PartNumber_1.PartNumber.create('ERROR-PART')];
            const user = MockFactory_1.MockFactory.createUser({ id: 999, balanceCents: 5000 });
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockEbaySearchService.search.mockRejectedValue(new Error('eBay API Error'));
            // Act & Assert
            await expect(useCase.execute({
                userId,
                username: 'admin',
                partNumbers,
                isAdmin: true,
            })).rejects.toThrow('eBay API Error');
            // Admin never gets charged, so no save calls
            expect(mockUserService.saveUser).not.toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
    describe('execute - balance calculation', () => {
        it('should calculate correct cost for multiple part numbers', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const partNumbers = [
                PartNumber_1.PartNumber.create('PART-1'),
                PartNumber_1.PartNumber.create('PART-2'),
                PartNumber_1.PartNumber.create('PART-3'),
                PartNumber_1.PartNumber.create('PART-4'),
                PartNumber_1.PartNumber.create('PART-5'),
            ];
            const user = MockFactory_1.MockFactory.createUser({ balanceCents: 20000 }); // $200
            const searchResults = partNumbers.map((pn) => MockFactory_1.MockFactory.createSearchResult({ partNumber: pn.getValue() }));
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockEbaySearchService.search.mockResolvedValue(searchResults);
            // Act
            const result = await useCase.execute({
                userId,
                username: 'testuser',
                partNumbers,
                isAdmin: false,
            });
            // Assert
            expect(result.cost.getCents()).toBe(1000); // 5 parts * $2 = $10
            expect(result.newBalance.getCents()).toBe(19000); // $200 - $10 = $190
        });
    });
    describe('execute - logging', () => {
        it('should log info at start of processing', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const partNumbers = [PartNumber_1.PartNumber.create('PART')];
            const user = MockFactory_1.MockFactory.createUser({ balanceCents: 10000 });
            mockUserService.getOrCreateUser.mockResolvedValue(user);
            mockUserService.saveUser.mockResolvedValue();
            mockEbaySearchService.search.mockResolvedValue([
                MockFactory_1.MockFactory.createSearchResult({ partNumber: 'PART' }),
            ]);
            // Act
            await useCase.execute({
                userId,
                username: 'testuser',
                partNumbers,
                isAdmin: false,
            });
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith('Processing search request', {
                userId: 123456,
                partNumbersCount: 1,
                isAdmin: false,
            });
        });
    });
});
