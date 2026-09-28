import type { Listing, MarketplaceProvider, MarketplaceQuery, ProviderStatus } from "@/lib/types";

type RawFacebookListing = Partial<Listing> & {
  id?: string | number;
  title?: string;
  price?: number | string | null;
  url?: string;
};

export class FacebookMarketplaceProvider implements MarketplaceProvider {
  name = "Facebook Marketplace";

  async isAvailable(): Promise<ProviderStatus> {
    if (!process.env.FACEBOOK_PROVIDER_ENDPOINT) {
      return {
        name: this.name,
        available: false,
        reason:
          "Facebook ingestion is not connected yet. Configure the authenticated browser-session endpoint first."
      };
    }

    return { name: this.name, available: true };
  }

  async search(query: MarketplaceQuery): Promise<Listing[]> {
    const status = await this.isAvailable();
    if (!status.available) return [];

    const response = await fetch(process.env.FACEBOOK_PROVIDER_ENDPOINT!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.FACEBOOK_PROVIDER_TOKEN
          ? { authorization: `Bearer ${process.env.FACEBOOK_PROVIDER_TOKEN}` }
          : {})
      },
      body: JSON.stringify(query),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Facebook session provider returned ${response.status}`);
    }

    const payload = await response.json();
    const raw: RawFacebookListing[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.listings)
        ? payload.listings
        : [];

    return raw
      .filter((item) => item?.url)
      .map((item) => ({
        id: String(item.id ?? item.url),
        provider: "Facebook Marketplace" as const,
        title: String(item.title ?? "Untitled listing"),
        price:
          typeof item.price === "number"
            ? item.price
            : typeof item.price === "string"
              ? Number(item.price.replace(/[^0-9.]/g, "")) || null
              : null,
        currency: String(item.currency ?? "USD"),
        url: String(item.url),
        imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
        location: item.location ? String(item.location) : undefined,
        distanceMiles:
          typeof item.distanceMiles === "number" ? item.distanceMiles : undefined,
        postedAt: item.postedAt ? String(item.postedAt) : undefined,
        condition: item.condition ? String(item.condition) : undefined,
        sellerName: item.sellerName ? String(item.sellerName) : undefined,
        sellerProfileUrl: item.sellerProfileUrl
          ? String(item.sellerProfileUrl)
          : undefined,
        sellerRating:
          typeof item.sellerRating === "number" ? item.sellerRating : undefined,
        description: item.description ? String(item.description) : undefined,
        category: item.category ? String(item.category) : undefined,
        isSold: Boolean(item.isSold),
        retrievedAt: new Date().toISOString()
      }));
  }
}
