export type MarketplaceQuery = {
  text: string;
  maxPrice?: number;
  location?: string;
  radiusMiles?: number;
};

export type MsrpMatch = {
  value: number;
  currency: "USD";
  confidence: "high" | "medium" | "low";
  sourceTitle: string;
  sourceUrl: string;
};

export type Listing = {
  id: string;
  provider: "Facebook Marketplace";
  title: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl?: string;
  location?: string;
  distanceMiles?: number;
  postedAt?: string;
  condition?: string;
  sellerName?: string;
  sellerProfileUrl?: string;
  sellerRating?: number;
  description?: string;
  category?: string;
  isSold?: boolean;
  retrievedAt: string;
  msrp?: MsrpMatch;
  discountPct?: number;
};

export type ScoredListing = Listing & {
  dealScore: number;
  reasons: string[];
};
