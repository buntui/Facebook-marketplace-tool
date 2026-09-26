export type MarketplaceQuery = {
  text: string;
  maxPrice?: number;
  location?: string;
  radiusMiles?: number;
};

export type Listing = {
  id: string;
  provider: string;
  title: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl?: string;
  location?: string;
  postedAt?: string;
  condition?: string;
  sellerName?: string;
  description?: string;
  retrievedAt: string;
};

export type ProviderStatus = {
  name: string;
  available: boolean;
  reason?: string;
};

export interface MarketplaceProvider {
  name: string;
  isAvailable(): Promise<ProviderStatus>;
  search(query: MarketplaceQuery): Promise<Listing[]>;
}
