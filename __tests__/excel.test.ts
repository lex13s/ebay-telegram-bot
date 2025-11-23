import { createExcelReport, ExcelRow } from '../src/excel';

describe('excel.ts', () => {
  describe('createExcelReport', () => {
    it('should create a buffer for valid data', async () => {
      const data: ExcelRow[] = [
        { partNumber: 'PN1', title: 'Title 1', price: '100.00 USD' },
        { partNumber: 'PN2', title: 'Title 2', price: 'N/A' },
      ];
      const buffer = await createExcelReport(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should create a valid buffer for empty data', async () => {
      const buffer = await createExcelReport([]);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
