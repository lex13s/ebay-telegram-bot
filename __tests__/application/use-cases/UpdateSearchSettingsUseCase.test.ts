/**
 * Tests for UpdateSearchSettingsUseCase
 */

import { UpdateSearchSettingsUseCase } from '../../../src/application/use-cases/UpdateSearchSettingsUseCase';
import { UserService } from '../../../src/application/services/UserService';
import { UserId } from '../../../src/domain/value-objects/UserId';
import { SearchConfigKey } from '../../../src/domain/value-objects/SearchConfigKey';
import { UserNotFoundError } from '../../../src/domain/errors/DomainErrors';
import { ILogger } from '../../../src/infrastructure/logging/Logger';

describe('Application Layer - Use Case: UpdateSearchSettingsUseCase', () => {
  let useCase: UpdateSearchSettingsUseCase;
  let mockUserService: jest.Mocked<UserService>;
  let mockLogger: jest.Mocked<ILogger>;

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

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    useCase = new UpdateSearchSettingsUseCase(mockUserService, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute - successful update', () => {
    it('should update search config to ACTIVE', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const newConfigKey = SearchConfigKey.create('ACTIVE');

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act
      await useCase.execute({ userId, newConfigKey });

      // Assert
      expect(mockUserService.updateSearchConfig).toHaveBeenCalledWith(userId, newConfigKey);
      expect(mockLogger.info).toHaveBeenCalledWith('Updating search settings', {
        userId: 123456,
        newConfigKey: 'ACTIVE',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Search settings updated', {
        userId: 123456,
        newConfigKey: 'ACTIVE',
      });
    });

    it('should update search config to SOLD', async () => {
      // Arrange
      const userId = UserId.create(789012);
      const newConfigKey = SearchConfigKey.create('SOLD');

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act
      await useCase.execute({ userId, newConfigKey });

      // Assert
      expect(mockUserService.updateSearchConfig).toHaveBeenCalledWith(userId, newConfigKey);
      expect(mockLogger.info).toHaveBeenCalledWith('Search settings updated', {
        userId: 789012,
        newConfigKey: 'SOLD',
      });
    });

    it('should update search config to ENDED', async () => {
      // Arrange
      const userId = UserId.create(345678);
      const newConfigKey = SearchConfigKey.create('ENDED');

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act
      await useCase.execute({ userId, newConfigKey });

      // Assert
      expect(mockUserService.updateSearchConfig).toHaveBeenCalledWith(userId, newConfigKey);
      expect(mockLogger.info).toHaveBeenCalledWith('Search settings updated', {
        userId: 345678,
        newConfigKey: 'ENDED',
      });
    });
  });

  describe('execute - multiple updates', () => {
    it('should handle multiple config updates for same user', async () => {
      // Arrange
      const userId = UserId.create(123456);
      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act - Update to ACTIVE
      await useCase.execute({
        userId,
        newConfigKey: SearchConfigKey.create('ACTIVE'),
      });

      // Act - Update to SOLD
      await useCase.execute({
        userId,
        newConfigKey: SearchConfigKey.create('SOLD'),
      });

      // Act - Update to ENDED
      await useCase.execute({
        userId,
        newConfigKey: SearchConfigKey.create('ENDED'),
      });

      // Assert
      expect(mockUserService.updateSearchConfig).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenCalledTimes(6); // 2 logs per update
    });

    it('should handle updates for different users', async () => {
      // Arrange
      const user1 = UserId.create(111);
      const user2 = UserId.create(222);
      const user3 = UserId.create(333);

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act
      await useCase.execute({ userId: user1, newConfigKey: SearchConfigKey.create('ACTIVE') });
      await useCase.execute({ userId: user2, newConfigKey: SearchConfigKey.create('SOLD') });
      await useCase.execute({ userId: user3, newConfigKey: SearchConfigKey.create('ENDED') });

      // Assert
      expect(mockUserService.updateSearchConfig).toHaveBeenCalledTimes(3);
    });
  });

  describe('execute - user not found', () => {
    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      const userId = UserId.create(999999);
      const newConfigKey = SearchConfigKey.create('ACTIVE');

      mockUserService.updateSearchConfig.mockRejectedValue(new UserNotFoundError(999999));

      // Act & Assert
      await expect(useCase.execute({ userId, newConfigKey })).rejects.toThrow(UserNotFoundError);

      expect(mockUserService.updateSearchConfig).toHaveBeenCalledWith(userId, newConfigKey);
    });
  });

  describe('execute - logging', () => {
    it('should log before updating', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const newConfigKey = SearchConfigKey.create('SOLD');

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act
      await useCase.execute({ userId, newConfigKey });

      // Assert
      expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'Updating search settings', {
        userId: 123456,
        newConfigKey: 'SOLD',
      });
    });

    it('should log after successful update', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const newConfigKey = SearchConfigKey.create('ACTIVE');

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act
      await useCase.execute({ userId, newConfigKey });

      // Assert
      expect(mockLogger.info).toHaveBeenNthCalledWith(2, 'Search settings updated', {
        userId: 123456,
        newConfigKey: 'ACTIVE',
      });
    });

    it('should not log success if update fails', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const newConfigKey = SearchConfigKey.create('ACTIVE');

      mockUserService.updateSearchConfig.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute({ userId, newConfigKey })).rejects.toThrow('Database error');

      // Should log "Updating" but not "updated"
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Updating search settings', expect.any(Object));
    });
  });

  describe('execute - error handling', () => {
    it('should propagate error from user service', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const newConfigKey = SearchConfigKey.create('ACTIVE');

      mockUserService.updateSearchConfig.mockRejectedValue(new Error('Service unavailable'));

      // Act & Assert
      await expect(useCase.execute({ userId, newConfigKey })).rejects.toThrow(
        'Service unavailable'
      );
    });

    it('should propagate database errors', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const newConfigKey = SearchConfigKey.create('SOLD');

      mockUserService.updateSearchConfig.mockRejectedValue(
        new Error('SQLITE_BUSY: database is locked')
      );

      // Act & Assert
      await expect(useCase.execute({ userId, newConfigKey })).rejects.toThrow('database is locked');
    });
  });

  describe('execute - return value', () => {
    it('should return void (undefined)', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const newConfigKey = SearchConfigKey.create('ACTIVE');

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act
      const result = await useCase.execute({ userId, newConfigKey });

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('execute - idempotency', () => {
    it('should handle setting same config multiple times', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const configKey = SearchConfigKey.create('ACTIVE');

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act - Set same config 3 times
      await useCase.execute({ userId, newConfigKey: configKey });
      await useCase.execute({ userId, newConfigKey: configKey });
      await useCase.execute({ userId, newConfigKey: configKey });

      // Assert - All calls should succeed
      expect(mockUserService.updateSearchConfig).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenCalledTimes(6);
    });
  });

  describe('execute - all config values', () => {
    it('should support all SearchConfigKey values', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const allConfigs = ['ACTIVE', 'SOLD', 'ENDED'];

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act & Assert
      for (const config of allConfigs) {
        const configKey = SearchConfigKey.create(config);
        await expect(useCase.execute({ userId, newConfigKey: configKey })).resolves.not.toThrow();
      }

      expect(mockUserService.updateSearchConfig).toHaveBeenCalledTimes(3);
    });
  });

  describe('execute - concurrent updates', () => {
    it('should handle concurrent updates for different users', async () => {
      // Arrange
      const users = [
        UserId.create(111),
        UserId.create(222),
        UserId.create(333),
        UserId.create(444),
        UserId.create(555),
      ];

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act - Execute all updates concurrently
      const promises = users.map((userId) =>
        useCase.execute({
          userId,
          newConfigKey: SearchConfigKey.create('ACTIVE'),
        })
      );

      await Promise.all(promises);

      // Assert
      expect(mockUserService.updateSearchConfig).toHaveBeenCalledTimes(5);
    });
  });

  describe('execute - integration with SearchConfigKey', () => {
    it('should correctly serialize SearchConfigKey for logging', async () => {
      // Arrange
      const userId = UserId.create(123456);
      const newConfigKey = SearchConfigKey.create('SOLD');

      mockUserService.updateSearchConfig.mockResolvedValue();

      // Act
      await useCase.execute({ userId, newConfigKey });

      // Assert - Check that toString() is called on SearchConfigKey
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          newConfigKey: 'SOLD',
        })
      );
    });
  });
});
