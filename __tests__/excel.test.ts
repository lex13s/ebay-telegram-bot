
import { createExcelReport, ExcelRow } from '../src/excel';

describe('excel.ts', () => {

    it('should create an Excel buffer from data', async () => {
        const testData: ExcelRow[] = [
            { partNumber: 'PN001', title: 'Test Item 1', price: '10.99' },
            { partNumber: 'PN002', title: 'Test Item 2', price: 125.00 },
            { partNumber: 'PN003', title: 'Not Found', price: 'N/A' },
        ];

        const buffer = await createExcelReport(testData);

        // Check if the output is a Buffer
        expect(buffer).toBeInstanceOf(Buffer);

        // Check if the buffer is not empty
        expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle empty data array', async () => {
        const testData: ExcelRow[] = [];
        const buffer = await createExcelReport(testData);

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0); // Excel file with just headers
    });
});
