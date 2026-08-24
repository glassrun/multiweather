import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geocode } from "@/lib/providers/geocode";

const querySchema = z.object({ q: z.string().min(1).max(100) });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ q: searchParams.get("q") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  try {
    const results = await geocode(parsed.data.q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("geocode lookup failed", err);
    return NextResponse.json({ error: "Location search is temporarily unavailable" }, { status: 502 });
  }
}
