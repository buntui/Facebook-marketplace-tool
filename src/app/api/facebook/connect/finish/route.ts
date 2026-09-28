import { NextResponse } from "next/server";
import { z } from "zod";
import { finishFacebookLogin } from "@/lib/browserbase";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  sessionId: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const { sessionId } = schema.parse(await req.json());
    await finishFacebookLogin(sessionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not finish Facebook login" },
      { status: 400 }
    );
  }
}
