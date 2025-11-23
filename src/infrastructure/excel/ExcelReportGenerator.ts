import ExcelJS from 'exceljs';
import { SearchResult } from '../../domain';
import { ILogger } from '../logging';

/**
 * Excel report generator
 */
export class ExcelReportGenerator {
  constructor(private readonly logger: ILogger) {}

  public async generate(results: SearchResult[]): Promise<Buffer> {
    try {
      this.logger.debug('Generating Excel report', { resultsCount: results.length });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('eBay Results');

      // Define columns
      worksheet.columns = [
        { header: 'Part Number', key: 'partNumber', width: 20 },
        { header: 'Listing Title', key: 'title', width: 50 },
        { header: 'Price', key: 'price', width: 15 },
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        cell.border = {
          bottom: { style: 'thin' },
        };
      });

      // Add data rows
      results.forEach((result) => {
        worksheet.addRow({
          partNumber: result.getPartNumber().getValue(),
          title: result.getTitle(),
          price: result.getPrice(),
        });
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      this.logger.debug('Excel report generated successfully');

      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error('Failed to generate Excel report', error as Error);
      throw error;
    }
  }
}

