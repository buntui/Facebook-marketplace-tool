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
      reasons.push("Way under budget");
    } else if (listing.price <= maxPrice * 0.8) {
      score += 15;
      reasons.push("Good price for your budget");
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
    if (Number.isFinite(ageHours) && ageHours <= 6) {
      score += 15;
      reasons.push("Very fresh listing");
    } else if (Number.isFinite(ageHours) && ageHours <= 24) {
      score += 10;
      reasons.push("Posted today");
    }
  }

  if (listing.distanceMiles !== undefined) {
    if (listing.distanceMiles <= 5) {
      score += 10;
      reasons.push("Very close");
    } else if (listing.distanceMiles <= 15) {
      score += 5;
      reasons.push("Nearby");
    }
  }

  if (listing.sellerRating !== undefined && listing.sellerRating >= 4.5) {
    score += 5;
    reasons.push("Highly rated seller");
  }

  if (listing.isSold) {
    score = 0;
    reasons.push("Marked sold");
  }

  return {
    ...listing,
    dealScore: Math.max(0, Math.min(100, score)),
    reasons
  };
}
