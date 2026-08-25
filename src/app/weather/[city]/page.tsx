import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboardContext";
import { getWeatherForLocation, type WeatherResponse } from "@/lib/weatherService";
import { labelFromSlug, parseCityParam, type ParsedCityParam } from "@/lib/citySlug";
import WeatherDashboard from "@/components/WeatherDashboard";

// Memoized per-request: generateMetadata and the page component both need
// this, and React's cache() dedupes identical calls within one render pass
// instead of hitting the providers/cache twice.
const loadWeather = cache(async (lat: number, lon: number) => {
  try {
    return { weather: await getWeatherForLocation(lat, lon), error: null };
  } catch (err) {
    return {
      weather: null as WeatherResponse | null,
      error: err instanceof Error ? err.message : "Failed to load weather",
    };
  }
});

function resolveLabel(parsed: ParsedCityParam, searchParams: Record<string, string | string[] | undefined>): string {
  const raw = searchParams.label;
  const queryLabel = typeof raw === "string" ? raw : undefined;
  return queryLabel && queryLabel.trim() ? queryLabel : labelFromSlug(parsed.slug);
}

export async function generateMetadata(props: PageProps<"/weather/[city]">): Promise<Metadata> {
  const [{ city }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const parsed = parseCityParam(city);
  if (!parsed) return {};

  const label = resolveLabel(parsed, searchParams);
  const { weather } = await loadWeather(parsed.latitude, parsed.longitude);

  const description = weather
    ? `Currently ${Math.round(weather.consensus.current.temperatureC)}°C, ${
        weather.consensus.current.condition ?? "conditions unavailable"
      } in ${label}. Multi-source current conditions and 7-day forecast.`
    : `Current conditions and 7-day forecast for ${label}, aggregated from multiple weather sources.`;

  return {
    title: `${label} weather forecast`,
    description,
    alternates: { canonical: `/weather/${city}` },
  };
}

export default async function CityWeatherPage(props: PageProps<"/weather/[city]">) {
  const [{ city }, searchParams, context] = await Promise.all([
    props.params,
    props.searchParams,
    getDashboardContext(),
  ]);

  const parsed = parseCityParam(city);
  if (!parsed) notFound();

  const label = resolveLabel(parsed, searchParams);
  const { weather, error } = await loadWeather(parsed.latitude, parsed.longitude);

  return (
    <WeatherDashboard
      locale={context.locale}
      isAuthenticated={context.isAuthenticated}
      initialSavedLocations={context.savedLocations}
      initialSelected={{ label, latitude: parsed.latitude, longitude: parsed.longitude }}
      initialWeather={weather}
      initialError={error}
    />
  );
}
