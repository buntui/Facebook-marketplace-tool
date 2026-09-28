import { NextResponse } from "next/server";
import { z } from "zod";
import { enrichWithMsrp } from "@/lib/msrp";
import { scoreListing } from "@/lib/scoring";
import type { Listing } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const listingSchema = z.object({
  id: z.string().min(1),
  provider: z.literal("Facebook Marketplace"),
  title: z.string().min(1),
  price: z.number().nullable(),
  currency: z.string().default("USD"),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
  location: z.string().optional(),
  retrievedAt: z.string()
});

const schema = z.object({
  text: z.string().min(1).max(200),
  maxPrice: z.number().positive().optional(),
  location: z.string().max(120).optional(),
  radiusMiles: z.number().positive().max(500).optional(),
  listings: z.array(listingSchema).max(120)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const seen = new Set<string>();
    const base: Listing[] = body.listings
      .filter((x) => {
        if (seen.has(x.id)) return false;
        seen.add(x.id);
        return true;
      })
      .filter((x) => body.maxPrice === undefined || x.price === null || x.price <= body.maxPrice);

    const withMsrp = await enrichWithMsrp(base, 12);

    const ranked = withMsrp
      .map((listing) => scoreListing(listing, body.maxPrice))
      .sort((a, b) => {
        const aDiscount = a.discountPct ?? -1;
        const bDiscount = b.discountPct ?? -1;
        if (aDiscount !== bDiscount) return bDiscount - aDiscount;
        return b.dealScore - a.dealScore;
      });

    return NextResponse.json({
      count: ranked.length,
      listings: ranked,
      msrpChecked: Math.min(base.length, 12)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not rank Marketplace listings" },
      { status: 400 }
    );
  }
}
