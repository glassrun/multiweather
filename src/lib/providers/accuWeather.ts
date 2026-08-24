import { fetchWithTimeout } from "./fetchWithTimeout";
import { env } from "@/lib/env";
import type { WeatherReading } from "@/lib/weather-types";

// AccuWeather's free dev tier is low-volume (~50 calls/day) and requires a
// location key lookup before any weather call, so this source is optional
// and expected to be skipped once the daily quota is used up.
export async function fetchAccuWeather(lat: number, lon: number): Promise<WeatherReading | null> {
  if (!env.ACCUWEATHER_API_KEY) return null;

  try {
    const key = env.ACCUWEATHER_API_KEY;
    const locRes = await fetchWithTimeout(
      `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${key}&q=${lat},${lon}`,
    );
    if (!locRes.ok) return null;
    const location = await locRes.json();
    const locationKey = location.Key as string | undefined;
    if (!locationKey) return null;

    const [currentRes, forecastRes] = await Promise.all([
      fetchWithTimeout(
        `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${key}&details=true`,
      ),
      fetchWithTimeout(
        `https://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${key}&metric=true`,
      ),
    ]);
    if (!currentRes.ok || !forecastRes.ok) return null;

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();
    const current = currentData?.[0];
    if (!current) return null;

    const daily = (forecastData.DailyForecasts ?? []).map(
      (d: {
        Date: string;
        Temperature: { Minimum: { Value: number }; Maximum: { Value: number } };
        Day: { PrecipitationProbability?: number; IconPhrase?: string };
      }) => ({
        date: d.Date.slice(0, 10),
        tempMinC: d.Temperature.Minimum.Value,
        tempMaxC: d.Temperature.Maximum.Value,
        precipitationProbabilityPercent: d.Day.PrecipitationProbability ?? null,
        condition: d.Day.IconPhrase ?? null,
      }),
    );

    return {
      source: "accuweather",
      fetchedAt: new Date().toISOString(),
      current: {
        temperatureC: current.Temperature.Metric.Value,
        feelsLikeC: current.RealFeelTemperature?.Metric?.Value ?? null,
        humidityPercent: current.RelativeHumidity ?? null,
        windSpeedKph: current.Wind?.Speed?.Metric?.Value ?? null,
        precipitationProbabilityPercent: daily[0]?.precipitationProbabilityPercent ?? null,
        condition: current.WeatherText ?? null,
      },
      daily,
    };
  } catch {
    return null;
  }
}
