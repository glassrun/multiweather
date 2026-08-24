import { fetchWithTimeout } from "./fetchWithTimeout";
import type { DailyForecast, WeatherReading } from "@/lib/weather-types";

const HEADERS = {
  "User-Agent": "weather-consensus-app (https://github.com/, contact: weather-app@example.com)",
  Accept: "application/geo+json",
};

const fToC = (f: number) => ((f - 32) * 5) / 9;

// NWS only covers US territory; any failure (network, non-US point, no
// nearby station) is treated as "source unavailable" rather than an error.
export async function fetchNws(lat: number, lon: number): Promise<WeatherReading | null> {
  try {
    const pointRes = await fetchWithTimeout(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
      { headers: HEADERS },
    );
    if (!pointRes.ok) return null;
    const point = await pointRes.json();
    const { forecast, observationStations } = point.properties ?? {};
    if (!forecast || !observationStations) return null;

    const [forecastRes, stationsRes] = await Promise.all([
      fetchWithTimeout(forecast, { headers: HEADERS }),
      fetchWithTimeout(observationStations, { headers: HEADERS }),
    ]);
    if (!forecastRes.ok || !stationsRes.ok) return null;

    const forecastData = await forecastRes.json();
    const stationsData = await stationsRes.json();
    const stationId = stationsData.features?.[0]?.id as string | undefined;

    let current: WeatherReading["current"] = {
      temperatureC: NaN,
      feelsLikeC: null,
      humidityPercent: null,
      windSpeedKph: null,
      precipitationProbabilityPercent: null,
      condition: null,
    };

    if (stationId) {
      const obsRes = await fetchWithTimeout(`${stationId}/observations/latest`, { headers: HEADERS });
      if (obsRes.ok) {
        const obs = await obsRes.json();
        const p = obs.properties ?? {};
        current = {
          temperatureC: p.temperature?.value ?? NaN,
          feelsLikeC: p.windChill?.value ?? p.heatIndex?.value ?? p.temperature?.value ?? null,
          humidityPercent: p.relativeHumidity?.value ?? null,
          windSpeedKph: p.windSpeed?.value ?? null,
          precipitationProbabilityPercent: null,
          condition: p.textDescription ?? null,
        };
      }
    }

    const periods: Array<{
      startTime: string;
      isDaytime: boolean;
      temperature: number;
      temperatureUnit: string;
      probabilityOfPrecipitation?: { value: number | null };
      shortForecast: string;
    }> = forecastData.properties?.periods ?? [];

    const byDate = new Map<string, DailyForecast>();
    for (const period of periods) {
      const date = period.startTime.slice(0, 10);
      const tempC = period.temperatureUnit === "F" ? fToC(period.temperature) : period.temperature;
      const pop = period.probabilityOfPrecipitation?.value ?? null;
      const existing = byDate.get(date);
      if (!existing) {
        byDate.set(date, {
          date,
          tempMinC: tempC,
          tempMaxC: tempC,
          precipitationProbabilityPercent: pop,
          condition: period.isDaytime ? period.shortForecast : null,
        });
      } else {
        existing.tempMinC = Math.min(existing.tempMinC, tempC);
        existing.tempMaxC = Math.max(existing.tempMaxC, tempC);
        if (pop !== null) {
          existing.precipitationProbabilityPercent = Math.max(
            existing.precipitationProbabilityPercent ?? 0,
            pop,
          );
        }
        if (period.isDaytime && !existing.condition) existing.condition = period.shortForecast;
      }
    }

    // If no station observation was available, fall back to the first forecast period.
    if (Number.isNaN(current.temperatureC) && periods[0]) {
      const first = periods[0];
      current = {
        temperatureC:
          first.temperatureUnit === "F" ? fToC(first.temperature) : first.temperature,
        feelsLikeC: null,
        humidityPercent: null,
        windSpeedKph: null,
        precipitationProbabilityPercent: first.probabilityOfPrecipitation?.value ?? null,
        condition: first.shortForecast,
      };
    }
    if (Number.isNaN(current.temperatureC)) return null;

    return {
      source: "nws",
      fetchedAt: new Date().toISOString(),
      current,
      daily: Array.from(byDate.values()),
    };
  } catch {
    return null;
  }
}
