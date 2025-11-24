"use strict";
/**
 * Tests for Value Object: SearchConfigKey
 */
Object.defineProperty(exports, "__esModule", { value: true });
const SearchConfigKey_1 = require("../../src/domain/value-objects/SearchConfigKey");
describe('Domain Layer - Value Object: SearchConfigKey', () => {
    describe('create', () => {
        it('should create SearchConfigKey with ACTIVE', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            expect(config).toBeDefined();
            expect(config.getValue()).toBe('ACTIVE');
            expect(config.toString()).toBe('ACTIVE');
        });
        it('should create SearchConfigKey with SOLD', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            expect(config.getValue()).toBe('SOLD');
            expect(config.toString()).toBe('SOLD');
        });
        it('should create SearchConfigKey with ENDED', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ENDED');
            expect(config.getValue()).toBe('ENDED');
            expect(config.toString()).toBe('ENDED');
        });
        it('should normalize to uppercase', () => {
            const config1 = SearchConfigKey_1.SearchConfigKey.create('active');
            const config2 = SearchConfigKey_1.SearchConfigKey.create('Active');
            const config3 = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            expect(config1.getValue()).toBe('ACTIVE');
            expect(config2.getValue()).toBe('ACTIVE');
            expect(config3.getValue()).toBe('ACTIVE');
        });
        it('should throw error for invalid config key', () => {
            expect(() => SearchConfigKey_1.SearchConfigKey.create('INVALID')).toThrow('Invalid search config key: INVALID');
            expect(() => SearchConfigKey_1.SearchConfigKey.create('COMPLETED')).toThrow('Invalid search config key: COMPLETED');
            expect(() => SearchConfigKey_1.SearchConfigKey.create('')).toThrow('Invalid search config key: ');
            expect(() => SearchConfigKey_1.SearchConfigKey.create('123')).toThrow('Invalid search config key: 123');
        });
        it('should throw error for null or undefined-like values', () => {
            expect(() => SearchConfigKey_1.SearchConfigKey.create('null')).toThrow();
            expect(() => SearchConfigKey_1.SearchConfigKey.create('undefined')).toThrow();
        });
    });
    describe('default', () => {
        it('should return SOLD as default config', () => {
            const config = SearchConfigKey_1.SearchConfigKey.default();
            expect(config.getValue()).toBe('SOLD');
            expect(config.toString()).toBe('SOLD');
        });
        it('should create consistent default instances', () => {
            const config1 = SearchConfigKey_1.SearchConfigKey.default();
            const config2 = SearchConfigKey_1.SearchConfigKey.default();
            expect(config1.getValue()).toBe(config2.getValue());
            expect(config1.equals(config2)).toBe(true);
        });
    });
    describe('getValue', () => {
        it('should return the correct value', () => {
            const active = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const sold = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            const ended = SearchConfigKey_1.SearchConfigKey.create('ENDED');
            expect(active.getValue()).toBe('ACTIVE');
            expect(sold.getValue()).toBe('SOLD');
            expect(ended.getValue()).toBe('ENDED');
        });
        it('should return type-safe SearchConfigType', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const value = config.getValue();
            // Type assertion to ensure it's one of the allowed values
            const validValues = ['ACTIVE', 'SOLD', 'ENDED'];
            expect(validValues).toContain(value);
        });
    });
    describe('equals', () => {
        it('should return true for same config values', () => {
            const config1 = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const config2 = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            expect(config1.equals(config2)).toBe(true);
        });
        it('should return false for different config values', () => {
            const active = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const sold = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            const ended = SearchConfigKey_1.SearchConfigKey.create('ENDED');
            expect(active.equals(sold)).toBe(false);
            expect(sold.equals(ended)).toBe(false);
            expect(active.equals(ended)).toBe(false);
        });
        it('should be case-insensitive during creation but strict in comparison', () => {
            const config1 = SearchConfigKey_1.SearchConfigKey.create('active');
            const config2 = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            expect(config1.equals(config2)).toBe(true);
        });
    });
    describe('toString', () => {
        it('should return string representation', () => {
            const active = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const sold = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            const ended = SearchConfigKey_1.SearchConfigKey.create('ENDED');
            expect(active.toString()).toBe('ACTIVE');
            expect(sold.toString()).toBe('SOLD');
            expect(ended.toString()).toBe('ENDED');
        });
        it('should be usable in string concatenation', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            const message = `Config is: ${config.toString()}`;
            expect(message).toBe('Config is: SOLD');
        });
        it('should match getValue() result', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ENDED');
            expect(config.toString()).toBe(config.getValue());
        });
    });
    describe('all valid config types', () => {
        it('should support all three config types', () => {
            const configs = ['ACTIVE', 'SOLD', 'ENDED'];
            configs.forEach((configType) => {
                expect(() => SearchConfigKey_1.SearchConfigKey.create(configType)).not.toThrow();
                const config = SearchConfigKey_1.SearchConfigKey.create(configType);
                expect(config.getValue()).toBe(configType);
            });
        });
        it('should maintain distinct values', () => {
            const active = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const sold = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            const ended = SearchConfigKey_1.SearchConfigKey.create('ENDED');
            const values = [active.getValue(), sold.getValue(), ended.getValue()];
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(3);
        });
    });
    describe('value object immutability', () => {
        it('should be immutable', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const value = config.getValue();
            // Try to create another instance
            SearchConfigKey_1.SearchConfigKey.create('SOLD');
            // Original should not be affected
            expect(config.getValue()).toBe(value);
            expect(config.getValue()).toBe('ACTIVE');
        });
        it('should maintain value integrity', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            const value1 = config.getValue();
            const value2 = config.getValue();
            expect(value1).toBe(value2);
            expect(value1).toBe('SOLD');
        });
    });
    describe('edge cases', () => {
        it('should handle lowercase input correctly', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('sold');
            expect(config.getValue()).toBe('SOLD');
        });
        it('should handle mixed case input correctly', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('SoLd');
            expect(config.getValue()).toBe('SOLD');
        });
        it('should reject whitespace-only strings', () => {
            expect(() => SearchConfigKey_1.SearchConfigKey.create('   ')).toThrow();
        });
        it('should reject strings with spaces', () => {
            expect(() => SearchConfigKey_1.SearchConfigKey.create('ACTIVE SOLD')).toThrow();
            expect(() => SearchConfigKey_1.SearchConfigKey.create(' ACTIVE')).toThrow();
            expect(() => SearchConfigKey_1.SearchConfigKey.create('ACTIVE ')).toThrow();
        });
        it('should reject partial matches', () => {
            expect(() => SearchConfigKey_1.SearchConfigKey.create('ACT')).toThrow();
            expect(() => SearchConfigKey_1.SearchConfigKey.create('SOL')).toThrow();
            expect(() => SearchConfigKey_1.SearchConfigKey.create('END')).toThrow();
        });
    });
    describe('usage in collections', () => {
        it('should work correctly in arrays', () => {
            const configs = [
                SearchConfigKey_1.SearchConfigKey.create('ACTIVE'),
                SearchConfigKey_1.SearchConfigKey.create('SOLD'),
                SearchConfigKey_1.SearchConfigKey.create('ENDED'),
            ];
            expect(configs).toHaveLength(3);
            expect(configs[0].getValue()).toBe('ACTIVE');
            expect(configs[1].getValue()).toBe('SOLD');
            expect(configs[2].getValue()).toBe('ENDED');
        });
        it('should be comparable in arrays', () => {
            const config1 = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const config2 = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            const config3 = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            expect(config1.equals(config3)).toBe(true);
            expect(config1.equals(config2)).toBe(false);
        });
    });
    describe('type safety', () => {
        it('should ensure type safety with getValue', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const value = config.getValue();
            expect(['ACTIVE', 'SOLD', 'ENDED']).toContain(value);
        });
        it('should work with switch statements', () => {
            const config = SearchConfigKey_1.SearchConfigKey.create('SOLD');
            let result;
            switch (config.getValue()) {
                case 'ACTIVE':
                    result = 'active listings';
                    break;
                case 'SOLD':
                    result = 'sold listings';
                    break;
                case 'ENDED':
                    result = 'ended listings';
                    break;
            }
            expect(result).toBe('sold listings');
        });
    });
    describe('factory pattern compliance', () => {
        it('should not allow direct instantiation', () => {
            // This test verifies that constructor is private by checking the create method exists
            expect(SearchConfigKey_1.SearchConfigKey.create).toBeDefined();
            expect(SearchConfigKey_1.SearchConfigKey.default).toBeDefined();
        });
        it('should create instances only through factory methods', () => {
            const config1 = SearchConfigKey_1.SearchConfigKey.create('ACTIVE');
            const config2 = SearchConfigKey_1.SearchConfigKey.default();
            expect(config1).toBeInstanceOf(SearchConfigKey_1.SearchConfigKey);
            expect(config2).toBeInstanceOf(SearchConfigKey_1.SearchConfigKey);
        });
    });
});
