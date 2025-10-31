import { searchItemsByKeyword } from './ebayApi';
import { EbayItem } from './types/ebay-api';

export async function findItem(
  partNumbers: string[], // Теперь принимает массив partNumbers
  configKey: string
): Promise<Array<{ partNumber: string; result: { title: string; price: string } | null }>> {
  console.log(`Searching for part numbers: ${partNumbers.join(', ')}, configKey: ${configKey}`);

  try {
    // Вызываем searchItemsByKeyword один раз с полным массивом partNumbers
    const resultsForAllKeywords = await searchItemsByKeyword(partNumbers, configKey);

    const formattedResults: Array<{ partNumber: string; result: { title: string; price: string } | null }> = [];

    // Обрабатываем результаты для каждого partNumber
    for (let i = 0; i < partNumbers.length; i++) {
      const currentPartNumber = partNumbers[i];
      const itemsForPartNumber: EbayItem[] = resultsForAllKeywords[i] || [];

      if (itemsForPartNumber.length > 0) {
        const item = itemsForPartNumber[0];
        const price = item.price?.value
          ? `${item.price.value} ${item.price.currency}`
          : 'Price not available';
        console.log(`Found item for ${currentPartNumber}: ${item.title}, Price: ${price}`);
        formattedResults.push({
          partNumber: currentPartNumber,
          result: {
            title: item.title || 'Title not available',
            price: price,
          },
        });
      } else {
        console.log(`No items found for part number: ${currentPartNumber}`);
        formattedResults.push({
          partNumber: currentPartNumber,
          result: null,
        });
      }
    }
    return formattedResults;

  } catch (error) {
    console.error('Error searching on eBay:', error);
    throw error;
  }
}
