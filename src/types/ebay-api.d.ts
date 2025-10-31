export interface EbayItem {
  itemId: string;
  title?: string;
  price?: {
    value: string;
    currency: string;
  };
  itemWebUrl?: string;
}
