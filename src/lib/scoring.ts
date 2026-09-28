import type { Listing, ScoredListing } from "./types";

export function scoreListing(listing: Listing, maxPrice?: number): ScoredListing {
  let score = 35;
  const reasons: string[] = [];

  if (listing.price !== null && listing.msrp?.value && listing.msrp.value > 0) {
    const discount = Math.max(0, Math.min(0.95, 1 - listing.price / listing.msrp.value));
    score += Math.round(discount * 60);

    if (discount >= 0.7) reasons.push(`${Math.round(discount * 100)}% below MSRP`);
    else if (discount >= 0.5) reasons.push(`${Math.round(discount * 100)}% below MSRP`);
    else if (discount >= 0.25) reasons.push(`${Math.round(discount * 100)}% below MSRP`);
  } else if (listing.price !== null && maxPrice !== undefined) {
    if (listing.price <= maxPrice * 0.5) {
      score += 20;
      reasons.push("Way under budget");
    } else if (listing.price <= maxPrice * 0.8) {
      score += 10;
      reasons.push("Under budget");
    }
  }

  if (listing.distanceMiles !== undefined) {
    if (listing.distanceMiles <= 5) {
      score += 5;
      reasons.push("Very close");
    } else if (listing.distanceMiles <= 15) {
      score += 3;
      reasons.push("Nearby");
    }
  }

  if (listing.sellerRating !== undefined && listing.sellerRating >= 4.5) {
    score += 4;
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
