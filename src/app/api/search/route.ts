import { NextResponse } from "next/server";
import { z } from "zod";
import { searchFacebookMarketplace } from "@/lib/browserbase";
import { enrichWithMsrp } from "@/lib/msrp";
import { scoreListing } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  contextId: z.string().min(1),
  text: z.string().min(1).max(200),
  maxPrice: z.number().positive().optional(),
  location: z.string().max(120).optional(),
  radiusMiles: z.number().positive().max(500).optional()
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const { contextId, ...query } = body;

    const searched = await searchFacebookMarketplace(contextId, query);

    if (searched.needsLogin) {
      return NextResponse.json({
        needsLogin: true,
        count: 0,
        listings: []
      });
    }

    const seen = new Set<string>();
    const base = searched.listings
      .filter((x) => {
        if (seen.has(x.id)) return false;
        seen.add(x.id);
        return true;
      })
      .filter((x) => !x.isSold)
      .filter((x) => query.maxPrice === undefined || x.price === null || x.price <= query.maxPrice);

    const withMsrp = await enrichWithMsrp(base, 10);

    const ranked = withMsrp
      .map((listing) => scoreListing(listing, query.maxPrice))
      .sort((a, b) => {
        const aDiscount = a.discountPct ?? -1;
        const bDiscount = b.discountPct ?? -1;
        if (aDiscount !== bDiscount) return bDiscount - aDiscount;
        return b.dealScore - a.dealScore;
      });

    return NextResponse.json({
      needsLogin: false,
      count: ranked.length,
      listings: ranked,
      msrpChecked: Math.min(base.length, 10)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Facebook Marketplace search failed" },
      { status: 400 }
    );
  }
}
