import type { Listing, MsrpMatch } from "./types";

type SearchResult = {
  title?: string;
  url?: string;
  snippet?: string;
  description?: string;
  text?: string;
};

function amounts(text: string) {
  return [...text.matchAll(/\$\s*([0-9][0-9,]*(?:\.\d{2})?)/g)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n >= 20 && n <= 100_000);
}

export async function lookupMsrp(listing: Listing): Promise<MsrpMatch | undefined> {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey || !listing.title) return undefined;

  const response = await fetch("https://api.browserbase.com/v1/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-BB-API-Key": apiKey
    },
    body: JSON.stringify({
      query: `"${listing.title}" MSRP manufacturer suggested retail price`,
      numResults: 6
    }),
    cache: "no-store"
  });

  if (!response.ok) return undefined;

  const payload = await response.json();
  const results: SearchResult[] = Array.isArray(payload?.results) ? payload.results : [];
  const candidates: Array<MsrpMatch & { priority: number }> = [];

  for (const result of results) {
    const joined = [
      result.title,
      result.snippet,
      result.description,
      result.text
    ].filter(Boolean).join(" ");

    const vals = amounts(joined);
    if (!vals.length || !result.url) continue;

    const explicit = /\b(msrp|manufacturer.?s suggested retail price|list price)\b/i.test(joined);
    const plausible = vals.filter((v) => listing.price === null || v >= listing.price * 1.05);
    if (!plausible.length) continue;

    const value = Math.max(...plausible);
    candidates.push({
      value,
      currency: "USD",
      confidence: explicit ? "high" : "medium",
      sourceTitle: result.title ?? "Web result",
      sourceUrl: result.url,
      priority: explicit ? 2 : 1
    });
  }

  candidates.sort((a, b) => b.priority - a.priority || a.value - b.value);
  const best = candidates[0];
  if (!best) return undefined;

  const { priority: _priority, ...match } = best;
  return match;
}

export async function enrichWithMsrp(listings: Listing[], limit = 10): Promise<Listing[]> {
  const head = listings.slice(0, limit);
  const tail = listings.slice(limit);

  const enriched = await Promise.all(
    head.map(async (listing) => {
      try {
        const msrp = await lookupMsrp(listing);
        if (!msrp || listing.price === null) return { ...listing, msrp };

        const discountPct = Math.max(
          0,
          Math.min(99, Math.round((1 - listing.price / msrp.value) * 100))
        );

        return { ...listing, msrp, discountPct };
      } catch {
        return listing;
      }
    })
  );

  return [...enriched, ...tail];
}
