import { searchItemsByKeyword } from './ebayApi';

export async function findItem(
  partNumber: string,
  configKey: string
): Promise<{ title: string; price: string } | null> {
  console.log(`Searching for part number: ${partNumber}, configKey: ${configKey}`);

  try {
    const items = await searchItemsByKeyword(partNumber, configKey);

    if (items.length > 0) {
      const item = items[0];
      const price = item.price?.value
        ? `${item.price.value} ${item.price.currency}`
        : 'Price not available';
      console.log(`Found item: ${item.title}, Price: ${price}`);
      return {
        title: item.title || 'Title not available',
        price: price,
      };
    } else {
      console.log(`No items found for part number: ${partNumber}`);
      return null;
    }
  } catch (error) {
    console.error('Error searching on eBay:', error);
    throw error;
  }
}
