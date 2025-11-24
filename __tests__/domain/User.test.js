"use strict";
/**
 * Tests for Entity: User
 */
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../../src/domain/entities/User");
const UserId_1 = require("../../src/domain/value-objects/UserId");
const Balance_1 = require("../../src/domain/value-objects/Balance");
const SearchConfigKey_1 = require("../../src/domain/value-objects/SearchConfigKey");
describe('Domain Layer - Entity: User', () => {
    describe('create', () => {
        it('should create user with all properties', () => {
            const userId = UserId_1.UserId.create(123456);
            const balance = Balance_1.Balance.create(10000); // $100
            const searchConfig = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            const user = User_1.User.create(userId, 'johndoe', balance, searchConfig);
            expect(user.getUserId().getValue()).toBe(123456);
            expect(user.getUsername()).toBe('johndoe');
            expect(user.getBalance().getCents()).toBe(10000);
            expect(user.getSearchConfigKey().getValue()).toBe('SOLD');
        });
        it('should create user without username', () => {
            const userId = UserId_1.UserId.create(123456);
            const balance = Balance_1.Balance.create(10000);
            const searchConfig = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const user = User_1.User.create(userId, null, balance, searchConfig);
            expect(user.getUsername()).toBeNull();
        });
    });
    describe('createNew', () => {
        it('should create new user with trial balance and default config', () => {
            const userId = UserId_1.UserId.create(123456);
            const trialBalance = Balance_1.Balance.fromDollars(10); // $10 trial
            const user = User_1.User.createNew(userId, 'newuser', trialBalance);
            expect(user.getUserId().getValue()).toBe(123456);
            expect(user.getUsername()).toBe('newuser');
            expect(user.getBalance().getDollars()).toBe(10);
            expect(user.getSearchConfigKey().getValue()).toBe(SearchConfigKey_1.SearchConfigKey.default().getValue());
        });
    });
    describe('addBalance', () => {
        it('should add balance to user', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(10000), // $100
            SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            user.addBalance(Balance_1.Balance.create(5000)); // Add $50
            expect(user.getBalance().getCents()).toBe(15000); // $150
        });
        it('should handle adding zero', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(10000), SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            user.addBalance(Balance_1.Balance.create(0));
            expect(user.getBalance().getCents()).toBe(10000);
        });
    });
    describe('deductBalance', () => {
        it('should deduct balance from user', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(10000), // $100
            SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            user.deductBalance(Balance_1.Balance.create(3000)); // Deduct $30
            expect(user.getBalance().getCents()).toBe(7000); // $70
        });
        it('should handle deducting zero', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(10000), SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            user.deductBalance(Balance_1.Balance.create(0));
            expect(user.getBalance().getCents()).toBe(10000);
        });
        it('should throw error when balance is insufficient', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(5000), // $50
            SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            expect(() => user.deductBalance(Balance_1.Balance.create(10000))).toThrow('Insufficient balance');
        });
    });
    describe('hasBalance', () => {
        it('should return true when balance is sufficient', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(10000), // $100
            SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            expect(user.hasBalance(Balance_1.Balance.create(5000))).toBe(true); // Has $50
        });
        it('should return true when balance equals required amount', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(10000), // $100
            SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            expect(user.hasBalance(Balance_1.Balance.create(10000))).toBe(true); // Has exactly $100
        });
        it('should return false when balance is insufficient', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(5000), // $50
            SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            expect(user.hasBalance(Balance_1.Balance.create(10000))).toBe(false); // Needs $100
        });
    });
    describe('updateSearchConfig', () => {
        it('should update search config to ACTIVE', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(10000), SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            user.updateSearchConfig(SearchConfigKey_1.SearchConfigKey.create('ACTIVE'));
            expect(user.getSearchConfigKey().getValue()).toBe('ACTIVE');
        });
        it('should update search config to ENDED', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'johndoe', Balance_1.Balance.create(10000), SearchConfigKey_1.SearchConfigKey.create('ACTIVE'));
            user.updateSearchConfig(SearchConfigKey_1.SearchConfigKey.create('ENDED'));
            expect(user.getSearchConfigKey().getValue()).toBe('ENDED');
        });
    });
    describe('updateUsername', () => {
        it('should update username', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'oldname', Balance_1.Balance.create(10000), SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            user.updateUsername('newname');
            expect(user.getUsername()).toBe('newname');
        });
        it('should set username to null', () => {
            const user = User_1.User.create(UserId_1.UserId.create(123456), 'oldname', Balance_1.Balance.create(10000), SearchConfigKey_1.SearchConfigKey.create('SOLD'));
            user.updateUsername(null);
            expect(user.getUsername()).toBeNull();
        });
    });
});
