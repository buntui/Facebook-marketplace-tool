import { NextResponse } from "next/server";
import { startFacebookLogin } from "@/lib/browserbase";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const session = await startFacebookLogin();
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start Facebook login" },
      { status: 500 }
    );
  }
}
