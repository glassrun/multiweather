import { fetchAllSources } from "@/lib/providers";
import { computeConsensus, DEFAULT_SOURCE_WEIGHTS, type ConsensusResult } from "@/lib/consensus";
import { getCached, setCached } from "@/lib/redis";
import type { WeatherReading } from "@/lib/weather-types";

const CURRENT_TTL_SECONDS = 15 * 60;
// Round to ~1km so nearby lookups (e.g. re-searching the same city) share a cache entry.
const roundCoord = (n: number) => Math.round(n * 100) / 100;

export interface WeatherResponse {
  location: { latitude: number; longitude: number };
  consensus: ConsensusResult;
  sources: WeatherReading[];
  cached: boolean;
}

function cacheKey(lat: number, lon: number) {
  return `weather:${roundCoord(lat)}:${roundCoord(lon)}`;
}

export async function getWeatherForLocation(lat: number, lon: number): Promise<WeatherResponse> {
  const key = cacheKey(lat, lon);
  const cached = await getCached<{ sources: WeatherReading[] }>(key);
  const sources = cached?.sources ?? (await fetchAllSources(lat, lon));

  if (sources.length === 0) {
    throw new Error("All weather sources failed or are unavailable for this location");
  }
  if (!cached) {
    await setCached(key, { sources }, CURRENT_TTL_SECONDS);
  }

  return {
    location: { latitude: lat, longitude: lon },
    consensus: computeConsensus(sources, DEFAULT_SOURCE_WEIGHTS),
    sources,
    cached: Boolean(cached),
  };
}
