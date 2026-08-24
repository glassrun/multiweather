import { fetchWithTimeout } from "./fetchWithTimeout";
import type { GeocodeResult } from "@/lib/weather-types";

const BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function geocode(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const url = new URL(BASE_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");

  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) return [];
  const data = await res.json();

  return (data.results ?? []).map((r: Record<string, unknown>) => ({
    name: r.name as string,
    admin1: r.admin1 as string | undefined,
    country: r.country as string,
    latitude: r.latitude as number,
    longitude: r.longitude as number,
    timezone: r.timezone as string | undefined,
  }));
}
