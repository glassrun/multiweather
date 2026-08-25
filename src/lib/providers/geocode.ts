import { fetchWithTimeout } from "./fetchWithTimeout";
import type { GeocodeResult } from "@/lib/weather-types";

const BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";

// Open-Meteo's geocoding search matches names within a single language's
// index - a Greek-script query against the English index (or vice versa)
// returns zero results even for well-known cities. Detect the query's
// script and hint the matching language; unsupported/undetected scripts
// fall back to English.
const SCRIPT_LANGUAGE_HINTS: Array<[RegExp, string]> = [
  [/[Ͱ-Ͽἀ-῿]/, "el"], // Greek
  [/[Ѐ-ӿ]/, "ru"], // Cyrillic
  [/[؀-ۿ]/, "ar"], // Arabic
  [/[֐-׿]/, "he"], // Hebrew
  [/[一-鿿]/, "zh"], // Han
  [/[぀-ヿ]/, "ja"], // Hiragana/Katakana
  [/[가-힣]/, "ko"], // Hangul
  [/[฀-๿]/, "th"], // Thai
];

function detectLanguage(query: string): string {
  for (const [pattern, lang] of SCRIPT_LANGUAGE_HINTS) {
    if (pattern.test(query)) return lang;
  }
  return "en";
}

async function searchWithLanguage(query: string, language: string): Promise<GeocodeResult[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", language);

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

export async function geocode(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];

  const language = detectLanguage(query);
  const results = await searchWithLanguage(query, language);
  if (results.length > 0 || language === "en") return results;

  // Detection can be wrong (e.g. a query that happens to match a script
  // pattern but isn't actually a place name in that language) - fall back
  // to English rather than silently showing nothing.
  return searchWithLanguage(query, "en");
}
