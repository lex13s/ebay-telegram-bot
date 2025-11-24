/**
 * Tests for ExcelReportGenerator
 */

import ExcelJS from 'exceljs';
import { ExcelReportGenerator } from '../../../src/infrastructure/excel/ExcelReportGenerator';
import { SearchResult } from '../../../src/domain/entities/SearchResult';
import { ILogger } from '../../../src/infrastructure/logging/Logger';
import { MockFactory } from '../../helpers';

describe('Infrastructure Layer - Excel: ExcelReportGenerator', () => {
  let generator: ExcelReportGenerator;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    generator = new ExcelReportGenerator(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate - basic functionality', () => {
    it('should generate Excel buffer from search results', async () => {
      const results = [MockFactory.createSearchResult({ partNumber: 'PART-001' })];

      const buffer = await generator.generate(results);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should log debug messages', async () => {
      const results = [MockFactory.createSearchResult({ partNumber: 'PART-001' })];

      await generator.generate(results);

      expect(mockLogger.debug).toHaveBeenCalledWith('Generating Excel report', { resultsCount: 1 });
      expect(mockLogger.debug).toHaveBeenCalledWith('Excel report generated successfully');
    });

    it('should create workbook with worksheet', async () => {
      const results = [MockFactory.createSearchResult({ partNumber: 'PART-001' })];

      const buffer = await generator.generate(results);

      // Parse generated buffer
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets).toHaveLength(1);
      expect(workbook.worksheets[0].name).toBe('eBay Results');
    });
  });

  describe('generate - headers', () => {
    it('should create correct column headers', async () => {
      const results = [MockFactory.createSearchResult({ partNumber: 'TEST' })];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      const headerRow = worksheet.getRow(1);
      expect(headerRow.getCell(1).value).toBe('Part Number');
      expect(headerRow.getCell(2).value).toBe('Listing Title');
      expect(headerRow.getCell(3).value).toBe('Price');
    });

    it('should style header row as bold', async () => {
      const results = [MockFactory.createSearchResult({ partNumber: 'TEST' })];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      const headerRow = worksheet.getRow(1);
      expect(headerRow.font?.bold).toBe(true);
    });

    it('should have grey background for headers', async () => {
      const results = [MockFactory.createSearchResult({ partNumber: 'TEST' })];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      const headerCell = worksheet.getRow(1).getCell(1);
      expect(headerCell.fill).toBeDefined();
    });
  });

  describe('generate - data rows', () => {
    it('should add single result as data row', async () => {
      const results = [
        MockFactory.createSearchResult({
          partNumber: 'PART-123',
          title: 'Test Item',
          priceValue: '99.99',
          priceCurrency: 'USD',
        }),
      ];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      const dataRow = worksheet.getRow(2);
      expect(dataRow.getCell(1).value).toBe('PART-123');
      expect(dataRow.getCell(2).value).toBe('Test Item');
      expect(dataRow.getCell(3).value).toBe('99.99 USD');
    });

    it('should add multiple results as data rows', async () => {
      const results = [
        MockFactory.createSearchResult({ partNumber: 'PART-001' }),
        MockFactory.createSearchResult({ partNumber: 'PART-002' }),
        MockFactory.createSearchResult({ partNumber: 'PART-003' }),
      ];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      // Header + 3 data rows
      expect(worksheet.rowCount).toBe(4);
    });

    it('should handle "Not Found" results', async () => {
      const results = [MockFactory.createSearchResultNotFound('NOT-FOUND')];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      const dataRow = worksheet.getRow(2);
      expect(dataRow.getCell(1).value).toBe('NOT-FOUND');
      expect(dataRow.getCell(2).value).toBe('Not Found');
      expect(dataRow.getCell(3).value).toBe('N/A');
    });

    it('should handle mix of found and not found results', async () => {
      const results = [
        MockFactory.createSearchResult({ partNumber: 'FOUND-001' }),
        MockFactory.createSearchResultNotFound('NOT-FOUND'),
        MockFactory.createSearchResult({ partNumber: 'FOUND-002' }),
      ];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.rowCount).toBe(4); // Header + 3 rows
      expect(worksheet.getRow(3).getCell(2).value).toBe('Not Found');
    });
  });

  describe('generate - empty results', () => {
    it('should generate Excel with only headers for empty results', async () => {
      const results: SearchResult[] = [];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.rowCount).toBe(1); // Only header
    });

    it('should log correct count for empty results', async () => {
      const results: SearchResult[] = [];

      await generator.generate(results);

      expect(mockLogger.debug).toHaveBeenCalledWith('Generating Excel report', { resultsCount: 0 });
    });
  });

  describe('generate - large datasets', () => {
    it('should handle 100 results', async () => {
      const results = Array.from({ length: 100 }, (_, i) =>
        MockFactory.createSearchResult({ partNumber: `PART-${i}` })
      );

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.rowCount).toBe(101); // Header + 100 rows
    });

    it('should handle 1000 results', async () => {
      const results = Array.from({ length: 1000 }, (_, i) =>
        MockFactory.createSearchResult({ partNumber: `PART-${i}` })
      );

      const buffer = await generator.generate(results);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe('generate - special characters', () => {
    it('should handle special characters in part numbers', async () => {
      const results = [
        MockFactory.createSearchResult({
          partNumber: 'PART#123-ABC_XYZ',
        }),
      ];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.getRow(2).getCell(1).value).toBe('PART#123-ABC_XYZ');
    });

    it('should handle special characters in titles', async () => {
      const results = [
        MockFactory.createSearchResult({
          partNumber: 'TEST',
          title: 'Item™ with "quotes" & symbols!',
        }),
      ];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.getRow(2).getCell(2).value).toBe('Item™ with "quotes" & symbols!');
    });

    it('should handle Unicode characters', async () => {
      const results = [
        MockFactory.createSearchResult({
          partNumber: 'UNI-123',
          title: '中文标题',
        }),
      ];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.getRow(2).getCell(1).value).toBe('UNI-123');
      expect(worksheet.getRow(2).getCell(2).value).toBe('中文标题');
    });
  });

  describe('generate - different currencies', () => {
    it('should handle USD prices', async () => {
      const results = [
        MockFactory.createSearchResult({
          partNumber: 'USD-ITEM',
          priceValue: '100.50',
          priceCurrency: 'USD',
        }),
      ];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.getRow(2).getCell(3).value).toBe('100.50 USD');
    });

    it('should handle different currencies', async () => {
      const results = [
        MockFactory.createSearchResult({
          partNumber: 'EUR-ITEM',
          priceValue: '50.00',
          priceCurrency: 'EUR',
        }),
        MockFactory.createSearchResult({
          partNumber: 'GBP-ITEM',
          priceValue: '75.99',
          priceCurrency: 'GBP',
        }),
      ];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.getRow(2).getCell(3).value).toBe('50.00 EUR');
      expect(worksheet.getRow(3).getCell(3).value).toBe('75.99 GBP');
    });
  });

  describe('generate - column widths', () => {
    it('should set appropriate column widths', async () => {
      const results = [MockFactory.createSearchResult({ partNumber: 'TEST' })];

      const buffer = await generator.generate(results);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      expect(worksheet.getColumn(1).width).toBe(20); // Part Number
      expect(worksheet.getColumn(2).width).toBe(50); // Title
      expect(worksheet.getColumn(3).width).toBe(15); // Price
    });
  });

  describe('generate - error handling', () => {
    it('should log error and throw on generation failure', async () => {
      // Force error by passing invalid data
      const invalidResults = null as any;

      await expect(generator.generate(invalidResults)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate Excel report',
        expect.any(Error)
      );
    });
  });

  describe('buffer properties', () => {
    it('should return valid Excel buffer', async () => {
      const results = [MockFactory.createSearchResult({ partNumber: 'TEST' })];

      const buffer = await generator.generate(results);

      // Check Excel file signature (PK at start for XLSX)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
    });

    it('should generate different buffers for different data', async () => {
      const results1 = [MockFactory.createSearchResult({ partNumber: 'PART-1' })];
      const results2 = [MockFactory.createSearchResult({ partNumber: 'PART-2' })];

      const buffer1 = await generator.generate(results1);
      const buffer2 = await generator.generate(results2);

      expect(buffer1).not.toEqual(buffer2);
    });
  });
});
