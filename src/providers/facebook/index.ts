import type { Listing, MarketplaceProvider, MarketplaceQuery, ProviderStatus } from "@/lib/types";

export class FacebookMarketplaceProvider implements MarketplaceProvider {
  name = "Facebook Marketplace";

  async isAvailable(): Promise<ProviderStatus> {
    if (!process.env.FACEBOOK_PROVIDER_ENDPOINT) {
      return {
        name: this.name,
        available: false,
        reason:
          "No compliant Facebook data endpoint is configured. The app will not bypass login, CAPTCHA, rate limits, or anti-bot protections."
      };
    }
    return { name: this.name, available: true };
  }

  async search(query: MarketplaceQuery): Promise<Listing[]> {
    const status = await this.isAvailable();
    if (!status.available) return [];

    const endpoint = process.env.FACEBOOK_PROVIDER_ENDPOINT!;
    const response = await fetch(endpoint, {
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
      throw new Error(`Facebook provider returned ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Facebook provider returned invalid data");

    return data.map((item: any) => ({
      id: String(item.id ?? item.url),
      provider: this.name,
      title: String(item.title ?? "Untitled listing"),
      price: typeof item.price === "number" ? item.price : null,
      currency: String(item.currency ?? "USD"),
      url: String(item.url),
      imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
      location: item.location ? String(item.location) : undefined,
      postedAt: item.postedAt ? String(item.postedAt) : undefined,
      condition: item.condition ? String(item.condition) : undefined,
      sellerName: item.sellerName ? String(item.sellerName) : undefined,
      description: item.description ? String(item.description) : undefined,
      retrievedAt: new Date().toISOString()
    }));
  }
}
