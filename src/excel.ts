import ExcelJS from 'exceljs'

/**
 * @file Handles the creation of Excel reports.
 */

/**
 * Defines the structure for a single row in the Excel report.
 */
export interface ExcelRow {
  /** The part number provided by the user. */
  partNumber: string
  /** The listing title found on eBay. */
  title: string
  /** The price of the item. Can be a string (e.g., 'N/A') or a number. */
  price: string | number
}

/**
 * Creates an Excel report from an array of search results.
 * @param data - An array of objects, where each object represents a row in the report.
 * @returns A Promise that resolves with a Buffer containing the Excel file data.
 */
export async function createExcelReport(data: ExcelRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('eBay Results')

  // Define the columns for the worksheet.
  // The `key` corresponds to the property name in the `ExcelRow` interface.
  worksheet.columns = [
    { header: 'Part Number', key: 'partNumber', width: 20 },
    { header: 'Listing Title', key: 'title', width: 50 },
    { header: 'Price', key: 'price', width: 15, style: { numFmt: '$#,##0.00' } },
  ]

  // Style the header row to make it stand out.
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }, // A light grey color
    }
    cell.border = {
      bottom: { style: 'thin' },
    }
  })

  // Add the actual data rows to the worksheet.
  data.forEach((item) => {
    worksheet.addRow(item)
  })

  // Serialize the workbook to a buffer, which can be sent as a file.
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer) // Ensure it returns a Node.js Buffer for compatibility.
}
