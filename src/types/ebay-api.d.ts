export interface EbayItem {
  title?: string;
  price?: {
    value: string;
    currency: string;
  };
  itemWebUrl?: string;
}
