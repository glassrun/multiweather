import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWeatherForLocation } from "@/lib/weatherService";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid or missing lat/lon" }, { status: 400 });
  }

  try {
    const result = await getWeatherForLocation(parsed.data.lat, parsed.data.lon);
    return NextResponse.json(result);
  } catch (err) {
    console.error("weather lookup failed", err);
    return NextResponse.json({ error: "Unable to fetch weather for this location" }, { status: 502 });
  }
}
