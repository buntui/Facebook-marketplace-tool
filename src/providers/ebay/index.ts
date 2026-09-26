import type { Listing, MarketplaceProvider, MarketplaceQuery, ProviderStatus } from "@/lib/types";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const id = process.env.EBAY_CLIENT_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("eBay credentials are not configured");

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope"
  });

  if (!response.ok) throw new Error(`eBay auth failed: ${response.status}`);
  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, Number(data.expires_in) - 60) * 1000
  };
  return cachedToken.token;
}

export class EbayProvider implements MarketplaceProvider {
  name = "eBay";

  async isAvailable(): Promise<ProviderStatus> {
    return process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET
      ? { name: this.name, available: true }
      : { name: this.name, available: false, reason: "Missing eBay API credentials" };
  }

  async search(query: MarketplaceQuery): Promise<Listing[]> {
    if (!(await this.isAvailable()).available) return [];
    const token = await getToken();

    const params = new URLSearchParams({
      q: query.text,
      limit: "50"
    });

    if (query.maxPrice !== undefined) {
      params.set("filter", `price:[..${query.maxPrice}],priceCurrency:USD`);
    }

    const response = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`eBay search failed: ${response.status}`);
    const data = await response.json();

    return (data.itemSummaries ?? []).map((item: any) => ({
      id: String(item.itemId),
      provider: this.name,
      title: String(item.title),
      price: item.price?.value ? Number(item.price.value) : null,
      currency: String(item.price?.currency ?? "USD"),
      url: String(item.itemWebUrl),
      imageUrl: item.image?.imageUrl,
      location: item.itemLocation?.city
        ? `${item.itemLocation.city}${item.itemLocation.stateOrProvince ? `, ${item.itemLocation.stateOrProvince}` : ""}`
        : undefined,
      condition: item.condition,
      retrievedAt: new Date().toISOString()
    }));
  }
}
