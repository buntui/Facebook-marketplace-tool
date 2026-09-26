import type { Listing } from "./types";

export type ScoredListing = Listing & {
  dealScore: number;
  reasons: string[];
};

export function scoreListing(listing: Listing, maxPrice?: number): ScoredListing {
  let score = 50;
  const reasons: string[] = [];

  if (listing.price !== null && maxPrice !== undefined) {
    if (listing.price <= maxPrice * 0.5) {
      score += 25;
      reasons.push("Far below your max budget");
    } else if (listing.price <= maxPrice * 0.8) {
      score += 15;
      reasons.push("Comfortably under budget");
    } else if (listing.price <= maxPrice) {
      score += 5;
      reasons.push("Within budget");
    } else {
      score -= 50;
      reasons.push("Over budget");
    }
  }

  if (listing.postedAt) {
    const ageMs = Date.now() - new Date(listing.postedAt).getTime();
    const ageHours = ageMs / 3_600_000;
    if (Number.isFinite(ageHours) && ageHours <= 24) {
      score += 10;
      reasons.push("Fresh listing");
    }
  }

  return {
    ...listing,
    dealScore: Math.max(0, Math.min(100, score)),
    reasons
  };
}
