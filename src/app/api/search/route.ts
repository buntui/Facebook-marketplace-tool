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
    const providers = getProviders();

    const statuses = await Promise.all(providers.map((p) => p.isAvailable()));

    const settled = await Promise.allSettled(
      providers.map(async (provider) => {
        const status = statuses.find((s) => s.name === provider.name);
        if (!status?.available) return [];
        return provider.search(query);
      })
    );

    const errors: string[] = [];
    const listings = settled.flatMap((result, i) => {
      if (result.status === "fulfilled") return result.value;
      errors.push(`${providers[i].name}: ${String(result.reason)}`);
      return [];
    });

    const seen = new Set<string>();
    const normalized = listings
      .filter((x) => {
        const key = `${x.provider}|${x.id}|${x.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .filter((x) => query.maxPrice === undefined || x.price === null || x.price <= query.maxPrice)
      .map((x) => scoreListing(x, query.maxPrice))
      .sort((a, b) => b.dealScore - a.dealScore);

    return NextResponse.json({
      query,
      statuses,
      errors,
      count: normalized.length,
      listings: normalized
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 400 }
    );
  }
}
