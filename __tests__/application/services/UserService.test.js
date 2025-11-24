"use strict";
/**
 * Tests for UserService
 */
Object.defineProperty(exports, "__esModule", { value: true });
const UserService_1 = require("../../../src/application/services/UserService");
const UserId_1 = require("../../../src/domain/value-objects/UserId");
const Balance_1 = require("../../../src/domain/value-objects/Balance");
const SearchConfigKey_1 = require("../../../src/domain/value-objects/SearchConfigKey");
const DomainErrors_1 = require("../../../src/domain/errors/DomainErrors");
const helpers_1 = require("../../helpers");
describe('Application Layer - Service: UserService', () => {
    let userService;
    let mockUserRepository;
    let mockLogger;
    let trialBalance;
    beforeEach(() => {
        mockUserRepository = new helpers_1.MockUserRepository();
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };
        trialBalance = Balance_1.Balance.fromDollars(10); // $10 trial balance
        userService = new UserService_1.UserService(mockUserRepository, trialBalance, mockLogger);
    });
    afterEach(() => {
        mockUserRepository.clear();
        jest.clearAllMocks();
    });
    describe('getOrCreateUser', () => {
        it('should create new user when user does not exist', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const username = 'newuser';
            // Act
            const user = await userService.getOrCreateUser(userId, username);
            // Assert
            expect(user).toBeDefined();
            expect(user.getUserId().getValue()).toBe(123456);
            expect(user.getUsername()).toBe('newuser');
            expect(user.getBalance().getCents()).toBe(1000); // $10 trial
            expect(mockLogger.debug).toHaveBeenCalledWith('Getting or creating user', { userId: 123456 });
            expect(mockLogger.debug).toHaveBeenCalledWith('User obtained', expect.any(Object));
        });
        it('should return existing user when user exists', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const existingUser = helpers_1.MockFactory.createUser({
                id: 123456,
                username: 'existinguser',
                balanceCents: 5000, // $50
            });
            // Pre-populate repository
            await mockUserRepository.save(existingUser);
            // Act
            const user = await userService.getOrCreateUser(userId, 'existinguser');
            // Assert
            expect(user.getUserId().getValue()).toBe(123456);
            expect(user.getUsername()).toBe('existinguser');
            expect(user.getBalance().getCents()).toBe(5000); // Original balance preserved
        });
        it('should create user without username', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(999999);
            // Act
            const user = await userService.getOrCreateUser(userId, null);
            // Assert
            expect(user.getUserId().getValue()).toBe(999999);
            expect(user.getUsername()).toBeNull();
            expect(user.getBalance().getCents()).toBe(1000); // $10 trial
        });
        it('should log user balance after creation', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            // Act
            await userService.getOrCreateUser(userId, 'testuser');
            // Assert
            expect(mockLogger.debug).toHaveBeenCalledWith('User obtained', {
                userId: 123456,
                balance: 1000,
            });
        });
    });
    describe('getUser', () => {
        it('should return user when user exists', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const existingUser = helpers_1.MockFactory.createUser({ id: 123456 });
            await mockUserRepository.save(existingUser);
            // Act
            const user = await userService.getUser(userId);
            // Assert
            expect(user).toBeDefined();
            expect(user.getUserId().getValue()).toBe(123456);
        });
        it('should throw UserNotFoundError when user does not exist', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(999999);
            // Act & Assert
            await expect(userService.getUser(userId)).rejects.toThrow(DomainErrors_1.UserNotFoundError);
            await expect(userService.getUser(userId)).rejects.toThrow('User not found: 999999');
        });
        it('should return user with correct balance', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const existingUser = helpers_1.MockFactory.createUser({
                id: 123456,
                balanceCents: 25000, // $250
            });
            await mockUserRepository.save(existingUser);
            // Act
            const user = await userService.getUser(userId);
            // Assert
            expect(user.getBalance().getCents()).toBe(25000);
            expect(user.getBalance().getDollars()).toBe(250);
        });
    });
    describe('updateBalance', () => {
        it('should update user balance successfully', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const user = helpers_1.MockFactory.createUser({ id: 123456, balanceCents: 5000 });
            await mockUserRepository.save(user);
            const newBalance = Balance_1.Balance.fromDollars(100);
            // Act
            await userService.updateBalance(userId, newBalance);
            // Assert
            const updatedUser = await mockUserRepository.findById(userId);
            expect(updatedUser).toBeDefined();
            expect(updatedUser.getBalance().getCents()).toBe(10000);
            expect(mockLogger.debug).toHaveBeenCalledWith('Updating user balance', {
                userId: 123456,
                newBalance: 10000,
            });
        });
        it('should update to zero balance', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const user = helpers_1.MockFactory.createUser({ id: 123456, balanceCents: 5000 });
            await mockUserRepository.save(user);
            const newBalance = Balance_1.Balance.create(0);
            // Act
            await userService.updateBalance(userId, newBalance);
            // Assert
            const updatedUser = await mockUserRepository.findById(userId);
            expect(updatedUser.getBalance().getCents()).toBe(0);
        });
        it('should update to large balance', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const user = helpers_1.MockFactory.createUser({ id: 123456, balanceCents: 1000 });
            await mockUserRepository.save(user);
            const newBalance = Balance_1.Balance.fromDollars(999999);
            // Act
            await userService.updateBalance(userId, newBalance);
            // Assert
            const updatedUser = await mockUserRepository.findById(userId);
            expect(updatedUser.getBalance().getCents()).toBe(99999900);
        });
    });
    describe('updateSearchConfig', () => {
        it('should update search config to ACTIVE', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const user = helpers_1.MockFactory.createUser({ id: 123456 });
            await mockUserRepository.save(user);
            const newConfig = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            // Act
            await userService.updateSearchConfig(userId, newConfig);
            // Assert
            const updatedUser = await mockUserRepository.findById(userId);
            expect(updatedUser).toBeDefined();
            expect(updatedUser.getSearchConfigKey().getValue()).toBe('ACTIVE');
            expect(mockLogger.debug).toHaveBeenCalledWith('Updating user search config', {
                userId: 123456,
                configKey: 'ACTIVE',
            });
        });
        it('should update search config to SOLD', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const user = helpers_1.MockFactory.createUser({ id: 123456, searchConfig: 'ACTIVE' });
            await mockUserRepository.save(user);
            const newConfig = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            // Act
            await userService.updateSearchConfig(userId, newConfig);
            // Assert
            const updatedUser = await mockUserRepository.findById(userId);
            expect(updatedUser.getSearchConfigKey().getValue()).toBe('SOLD');
        });
        it('should update search config to ENDED', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const user = helpers_1.MockFactory.createUser({ id: 123456 });
            await mockUserRepository.save(user);
            const newConfig = SearchConfigKey_1.SearchConfigKey.create('ENDED');
            // Act
            await userService.updateSearchConfig(userId, newConfig);
            // Assert
            const updatedUser = await mockUserRepository.findById(userId);
            expect(updatedUser.getSearchConfigKey().getValue()).toBe('ENDED');
        });
        it('should allow setting same config multiple times (idempotent)', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            const user = helpers_1.MockFactory.createUser({ id: 123456 });
            await mockUserRepository.save(user);
            const config = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            // Act
            await userService.updateSearchConfig(userId, config);
            await userService.updateSearchConfig(userId, config);
            await userService.updateSearchConfig(userId, config);
            // Assert
            const updatedUser = await mockUserRepository.findById(userId);
            expect(updatedUser.getSearchConfigKey().getValue()).toBe('ACTIVE');
            expect(mockLogger.debug).toHaveBeenCalledTimes(3);
        });
    });
    describe('saveUser', () => {
        it('should save new user', async () => {
            // Arrange
            const user = helpers_1.MockFactory.createUser({ id: 123456 });
            // Act
            await userService.saveUser(user);
            // Assert
            const savedUser = await mockUserRepository.findById(UserId_1.UserId.create(123456));
            expect(savedUser).toBeDefined();
            expect(savedUser.getUserId().getValue()).toBe(123456);
        });
        it('should update existing user', async () => {
            // Arrange
            const user = helpers_1.MockFactory.createUser({ id: 123456, balanceCents: 5000 });
            await mockUserRepository.save(user);
            // Modify user
            user.addBalance(Balance_1.Balance.fromDollars(50));
            // Act
            await userService.saveUser(user);
            // Assert
            const savedUser = await mockUserRepository.findById(UserId_1.UserId.create(123456));
            expect(savedUser.getBalance().getCents()).toBe(10000); // $50 + $50 = $100
        });
        it('should preserve all user data', async () => {
            // Arrange
            const user = helpers_1.MockFactory.createUser({
                id: 999,
                username: 'fulltest',
                balanceCents: 12345,
                searchConfig: 'SOLD',
            });
            // Act
            await userService.saveUser(user);
            // Assert
            const savedUser = await mockUserRepository.findById(UserId_1.UserId.create(999));
            expect(savedUser).toBeDefined();
            expect(savedUser.getUserId().getValue()).toBe(999);
            expect(savedUser.getUsername()).toBe('fulltest');
            expect(savedUser.getBalance().getCents()).toBe(12345);
            expect(savedUser.getSearchConfigKey().getValue()).toBe('SOLD');
        });
    });
    describe('integration scenarios', () => {
        it('should handle full user lifecycle', async () => {
            // Create user
            const userId = UserId_1.UserId.create(123456);
            const user = await userService.getOrCreateUser(userId, 'lifecycle_user');
            expect(user.getBalance().getCents()).toBe(1000); // Trial balance
            // Update balance
            await userService.updateBalance(userId, Balance_1.Balance.fromDollars(50));
            const userAfterBalanceUpdate = await userService.getUser(userId);
            expect(userAfterBalanceUpdate.getBalance().getCents()).toBe(5000);
            // Update search config
            await userService.updateSearchConfig(userId, SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            const userAfterConfigUpdate = await userService.getUser(userId);
            expect(userAfterConfigUpdate.getSearchConfigKey().getValue()).toBe('SOLD');
        });
        it('should handle multiple users independently', async () => {
            // Create multiple users
            const user1 = await userService.getOrCreateUser(UserId_1.UserId.create(111), 'user1');
            const user2 = await userService.getOrCreateUser(UserId_1.UserId.create(222), 'user2');
            const user3 = await userService.getOrCreateUser(UserId_1.UserId.create(333), 'user3');
            // Verify all created
            expect(user1.getUserId().getValue()).toBe(111);
            expect(user2.getUserId().getValue()).toBe(222);
            expect(user3.getUserId().getValue()).toBe(333);
            // Update different users
            await userService.updateBalance(UserId_1.UserId.create(111), Balance_1.Balance.fromDollars(100));
            await userService.updateBalance(UserId_1.UserId.create(222), Balance_1.Balance.fromDollars(200));
            await userService.updateBalance(UserId_1.UserId.create(333), Balance_1.Balance.fromDollars(300));
            // Verify independence
            const u1 = await userService.getUser(UserId_1.UserId.create(111));
            const u2 = await userService.getUser(UserId_1.UserId.create(222));
            const u3 = await userService.getUser(UserId_1.UserId.create(333));
            expect(u1.getBalance().getDollars()).toBe(100);
            expect(u2.getBalance().getDollars()).toBe(200);
            expect(u3.getBalance().getDollars()).toBe(300);
        });
        it('should handle user operations with entity methods', async () => {
            // Create user
            const userId = UserId_1.UserId.create(123456);
            const user = await userService.getOrCreateUser(userId, 'entity_test');
            // Use entity methods
            user.addBalance(Balance_1.Balance.fromDollars(50));
            user.deductBalance(Balance_1.Balance.fromDollars(20));
            user.updateSearchConfig(SearchConfigKey_1.SearchConfigKey.create('ENDED'));
            // Save
            await userService.saveUser(user);
            // Verify
            const savedUser = await userService.getUser(userId);
            expect(savedUser.getBalance().getDollars()).toBe(40); // $10 + $50 - $20
            expect(savedUser.getSearchConfigKey().getValue()).toBe('ENDED');
        });
    });
    describe('error handling', () => {
        it('should propagate repository errors', async () => {
            // Arrange - Mock repository to throw error
            const errorRepo = {
                findById: jest.fn().mockRejectedValue(new Error('Database connection lost')),
                save: jest.fn(),
                getOrCreate: jest.fn(),
                updateBalance: jest.fn(),
                updateSearchConfig: jest.fn(),
                exists: jest.fn(),
            };
            const errorService = new UserService_1.UserService(errorRepo, trialBalance, mockLogger);
            const userId = UserId_1.UserId.create(123456);
            // Act & Assert
            await expect(errorService.getUser(userId)).rejects.toThrow('Database connection lost');
        });
    });
    describe('logging', () => {
        it('should log debug messages for all operations', async () => {
            // Arrange
            const userId = UserId_1.UserId.create(123456);
            // Act
            await userService.getOrCreateUser(userId, 'logtest');
            await userService.updateBalance(userId, Balance_1.Balance.fromDollars(100));
            await userService.updateSearchConfig(userId, SearchConfigKey_1.SearchConfigKey.create('ACTIVE'));
            // Assert
            expect(mockLogger.debug).toHaveBeenCalledWith('Getting or creating user', { userId: 123456 });
            expect(mockLogger.debug).toHaveBeenCalledWith('Updating user balance', expect.any(Object));
            expect(mockLogger.debug).toHaveBeenCalledWith('Updating user search config', expect.any(Object));
        });
    });
});
