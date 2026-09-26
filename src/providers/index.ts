import type { MarketplaceProvider } from "@/lib/types";
import { FacebookMarketplaceProvider } from "./facebook";
import { EbayProvider } from "./ebay";

export function getProviders(): MarketplaceProvider[] {
  return [new FacebookMarketplaceProvider(), new EbayProvider()];
}
