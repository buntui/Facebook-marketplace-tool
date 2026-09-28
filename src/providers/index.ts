import type { MarketplaceProvider } from "@/lib/types";
import { FacebookMarketplaceProvider } from "./facebook";

export function getProviders(): MarketplaceProvider[] {
  return [new FacebookMarketplaceProvider()];
}
