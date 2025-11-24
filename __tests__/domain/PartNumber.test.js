"use strict";
/**
 * Тесты для Value Object: PartNumber
 */
Object.defineProperty(exports, "__esModule", { value: true });
const PartNumber_1 = require("../../src/domain/value-objects/PartNumber");
describe('Domain Layer - Value Object: PartNumber', () => {
    describe('create', () => {
        it('should create PartNumber with valid value', () => {
            const partNumber = PartNumber_1.PartNumber.create('ABC123');
            expect(partNumber.getValue()).toBe('ABC123');
        });
        it('should trim whitespace from part number', () => {
            const partNumber = PartNumber_1.PartNumber.create('  ABC123  ');
            expect(partNumber.getValue()).toBe('ABC123');
        });
        it('should throw error for empty string', () => {
            expect(() => PartNumber_1.PartNumber.create('')).toThrow('Part number cannot be empty');
        });
        it('should throw error for whitespace-only string', () => {
            expect(() => PartNumber_1.PartNumber.create('   ')).toThrow('Part number cannot be empty');
        });
        it('should accept part numbers with special characters', () => {
            const partNumber = PartNumber_1.PartNumber.create('ABC-123_XYZ');
            expect(partNumber.getValue()).toBe('ABC-123_XYZ');
        });
        it('should accept alphanumeric part numbers', () => {
            const partNumber = PartNumber_1.PartNumber.create('12345ABC');
            expect(partNumber.getValue()).toBe('12345ABC');
        });
    });
    describe('equals', () => {
        it('should return true for equal part numbers', () => {
            const partNumber1 = PartNumber_1.PartNumber.create('ABC123');
            const partNumber2 = PartNumber_1.PartNumber.create('ABC123');
            expect(partNumber1.equals(partNumber2)).toBe(true);
        });
        it('should return false for different part numbers', () => {
            const partNumber1 = PartNumber_1.PartNumber.create('ABC123');
            const partNumber2 = PartNumber_1.PartNumber.create('XYZ789');
            expect(partNumber1.equals(partNumber2)).toBe(false);
        });
    });
    describe('toString', () => {
        it('should return string representation of part number', () => {
            const partNumber = PartNumber_1.PartNumber.create('ABC123');
            expect(partNumber.toString()).toBe('ABC123');
        });
    });
});
