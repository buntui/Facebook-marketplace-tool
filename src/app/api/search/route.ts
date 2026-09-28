import { NextResponse } from "next/server";
import { z } from "zod";
import { getProviders } from "@/providers";
import { scoreListing } from "@/lib/scoring";

export const dynamic = "force-dynamic";

const schema = z.object({
  text: z.string().min(1).max(200),
  maxPrice: z.number().positive().optional(),
  location: z.string().max(120).optional(),
  radiusMiles: z.number().positive().max(500).optional()
});

export async function POST(req: Request) {
  try {
    const query = schema.parse(await req.json());
    const [provider] = getProviders();
    const status = await provider.isAvailable();

    if (!status.available) {
      return NextResponse.json({
        query,
        status,
        count: 0,
        listings: []
      });
    }

    const listings = await provider.search(query);

    const seen = new Set<string>();
    const normalized = listings
      .filter((x) => {
        const key = `${x.id}|${x.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .filter((x) => !x.isSold)
      .filter((x) => query.maxPrice === undefined || x.price === null || x.price <= query.maxPrice)
      .filter(
        (x) =>
          query.radiusMiles === undefined ||
          x.distanceMiles === undefined ||
          x.distanceMiles <= query.radiusMiles
      )
      .map((x) => scoreListing(x, query.maxPrice))
      .sort((a, b) => b.dealScore - a.dealScore);

    return NextResponse.json({
      query,
      status,
      count: normalized.length,
      listings: normalized
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Facebook Marketplace search failed" },
      { status: 400 }
    );
  }
}
