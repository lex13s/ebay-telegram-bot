/**
 * Tests for ProcessSearchUseCase
 */

import { ProcessSearchUseCase } from '../../../src/application/use-cases/ProcessSearchUseCase';
import { UserService } from '../../../src/application/services/UserService';
import { EbaySearchService } from '../../../src/application/services/EbaySearchService';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { Balance } from '../../../src/domain/value-objects/Balance';
import { PartNumber } from '../../../src/domain/value-objects/PartNumber';
import { InsufficientFundsError } from '../../../src/domain/errors/DomainErrors';
import { ILogger } from '../../../src/infrastructure/logging/Logger';
import { MockFactory } from '../../helpers/MockFactory';

describe('Application Layer - Use Case: ProcessSearchUseCase', () => {
  let useCase: ProcessSearchUseCase;
  let mockUserService: jest.Mocked<UserService>;
  let mockEbaySearchService: jest.Mocked<EbaySearchService>;
  let mockLogger: jest.Mocked<ILogger>;
  let costPerRequest: Balance;

  beforeEach(() => {
    // Setup mocks
    mockUserService = {
      getOrCreateUser: jest.fn(),
      saveUser: jest.fn(),
      getUserById: jest.fn(),
      addBalance: jest.fn(),
      deductBalance: jest.fn(),
      updateSearchConfig: jest.fn(),
    } as any;

    mockEbaySearchService = {
      search: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    costPerRequest = Balance.fromDollars(2); // $2 per request
    useCase = new ProcessSearchUseCase(
      mockUserService,
      mockEbaySearchService,
      costPerRequest,
      mockLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - successful search', () => {
    it('should process search successfully with results', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const partNumbers = [PartNumber.create('PART-001'), PartNumber.create('PART-002')];
      const user = MockFactory.createUser({
        id: 123456,
        balanceCents: 10000, // $100
      });

      const searchResults = [
        MockFactory.createSearchResult({ partNumber: 'PART-001' }),
        MockFactory.createSearchResult({ partNumber: 'PART-002' }),
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
      expect(mockEbaySearchService.search).toHaveBeenCalledWith(
        partNumbers,
        user.getSearchConfigKey()
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Search completed successfully',
        expect.any(Object)
      );
    });

    it('should handle single part number search', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const partNumbers = [PartNumber.create('SINGLE-PART')];
      const user = MockFactory.createUser({ balanceCents: 5000 });

      const searchResults = [MockFactory.createSearchResult({ partNumber: 'SINGLE-PART' })];

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
      const userId = UserId.create(999);
      const partNumbers = [PartNumber.create('ADMIN-PART')];
      const user = MockFactory.createUser({ id: 999, balanceCents: 5000 });

      const searchResults = [MockFactory.createSearchResult({ partNumber: 'ADMIN-PART' })];

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
      const userId = UserId.create(999);
      const partNumbers = [PartNumber.create('PART-1'), PartNumber.create('PART-2')];
      const user = MockFactory.createUser({ id: 999, balanceCents: 0 });

      const searchResults = [
        MockFactory.createSearchResult({ partNumber: 'PART-1' }),
        MockFactory.createSearchResult({ partNumber: 'PART-2' }),
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
      const userId = UserId.create(123456);
      const partNumbers = [
        PartNumber.create('PART-1'),
        PartNumber.create('PART-2'),
        PartNumber.create('PART-3'),
      ];
      const user = MockFactory.createUser({
        balanceCents: 100, // Only $1, need $6 (3 * $2)
      });

      mockUserService.getOrCreateUser.mockResolvedValue(user);

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          username: 'pooruser',
          partNumbers,
          isAdmin: false,
        })
      ).rejects.toThrow(InsufficientFundsError);

      // Should NOT call save or search if insufficient funds
      expect(mockUserService.saveUser).not.toHaveBeenCalled();
      expect(mockEbaySearchService.search).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Insufficient funds', expect.any(Object));
    });

    it('should throw when balance is exactly one cent short', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const partNumbers = [PartNumber.create('PART')];
      const user = MockFactory.createUser({
        balanceCents: 199, // $1.99, need $2.00
      });

      mockUserService.getOrCreateUser.mockResolvedValue(user);

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          username: 'user',
          partNumbers,
          isAdmin: false,
        })
      ).rejects.toThrow(InsufficientFundsError);
    });
  });

  describe('execute - no results found (refund)', () => {
    it('should refund when no results are found', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const partNumbers = [PartNumber.create('NOT-FOUND')];
      const user = MockFactory.createUser({ balanceCents: 10000 });

      // SearchResult with isFound() = false
      const emptyResults = [MockFactory.createSearchResultNotFound('NOT-FOUND')];

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
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Search completed with no results - refunded',
        expect.any(Object)
      );
    });

    it('should NOT refund for admin even with no results', async () => {
      // Arrange
      const userId = UserId.create(999);
      const partNumbers = [PartNumber.create('NOT-FOUND')];
      const user = MockFactory.createUser({ id: 999, balanceCents: 5000 });

      const emptyResults = [MockFactory.createSearchResultNotFound('NOT-FOUND')];

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
      const userId = UserId.create(123456);
      const partNumbers = [PartNumber.create('ERROR-PART')];
      const user = MockFactory.createUser({ balanceCents: 10000 });

      mockUserService.getOrCreateUser.mockResolvedValue(user);
      mockUserService.saveUser.mockResolvedValue();
      mockEbaySearchService.search.mockRejectedValue(new Error('eBay API Error'));

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          username: 'testuser',
          partNumbers,
          isAdmin: false,
        })
      ).rejects.toThrow('eBay API Error');

      // Should save twice: once for deduction, once for refund
      expect(mockUserService.saveUser).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Search failed - refunded',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should NOT refund admin on search error', async () => {
      // Arrange
      const userId = UserId.create(999);
      const partNumbers = [PartNumber.create('ERROR-PART')];
      const user = MockFactory.createUser({ id: 999, balanceCents: 5000 });

      mockUserService.getOrCreateUser.mockResolvedValue(user);
      mockEbaySearchService.search.mockRejectedValue(new Error('eBay API Error'));

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          username: 'admin',
          partNumbers,
          isAdmin: true,
        })
      ).rejects.toThrow('eBay API Error');

      // Admin never gets charged, so no save calls
      expect(mockUserService.saveUser).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('execute - balance calculation', () => {
    it('should calculate correct cost for multiple part numbers', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const partNumbers = [
        PartNumber.create('PART-1'),
        PartNumber.create('PART-2'),
        PartNumber.create('PART-3'),
        PartNumber.create('PART-4'),
        PartNumber.create('PART-5'),
      ];
      const user = MockFactory.createUser({ balanceCents: 20000 }); // $200

      const searchResults = partNumbers.map((pn) =>
        MockFactory.createSearchResult({ partNumber: pn.getValue() })
      );

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
      const userId = UserId.create(123456);
      const partNumbers = [PartNumber.create('PART')];
      const user = MockFactory.createUser({ balanceCents: 10000 });

      mockUserService.getOrCreateUser.mockResolvedValue(user);
      mockUserService.saveUser.mockResolvedValue();
      mockEbaySearchService.search.mockResolvedValue([
        MockFactory.createSearchResult({ partNumber: 'PART' }),
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
