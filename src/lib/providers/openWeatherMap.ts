import { fetchWithTimeout } from "./fetchWithTimeout";
import { env } from "@/lib/env";
import type { DailyForecast, WeatherReading } from "@/lib/weather-types";

export async function fetchOpenWeatherMap(lat: number, lon: number): Promise<WeatherReading | null> {
  if (!env.OPENWEATHERMAP_API_KEY) return null;

  try {
    const params = `lat=${lat}&lon=${lon}&units=metric&appid=${env.OPENWEATHERMAP_API_KEY}`;
    const [currentRes, forecastRes] = await Promise.all([
      fetchWithTimeout(`https://api.openweathermap.org/data/2.5/weather?${params}`),
      fetchWithTimeout(`https://api.openweathermap.org/data/2.5/forecast?${params}`),
    ]);
    if (!currentRes.ok || !forecastRes.ok) return null;

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    // The free forecast endpoint returns 3-hour blocks; bucket them into days.
    const byDate = new Map<string, { min: number; max: number; pops: number[]; conditions: string[] }>();
    for (const block of forecastData.list ?? []) {
      const date = block.dt_txt.slice(0, 10);
      const temp = block.main.temp as number;
      const entry = byDate.get(date) ?? { min: temp, max: temp, pops: [], conditions: [] };
      entry.min = Math.min(entry.min, block.main.temp_min ?? temp);
      entry.max = Math.max(entry.max, block.main.temp_max ?? temp);
      if (typeof block.pop === "number") entry.pops.push(block.pop * 100);
      if (block.weather?.[0]?.main) entry.conditions.push(block.weather[0].main);
      byDate.set(date, entry);
    }

    const daily: DailyForecast[] = Array.from(byDate.entries()).map(([date, v]) => ({
      date,
      tempMinC: v.min,
      tempMaxC: v.max,
      precipitationProbabilityPercent: v.pops.length
        ? Math.max(...v.pops)
        : null,
      condition: v.conditions[0] ?? null,
    }));

    return {
      source: "openweathermap",
      fetchedAt: new Date().toISOString(),
      current: {
        temperatureC: currentData.main.temp,
        feelsLikeC: currentData.main.feels_like ?? null,
        humidityPercent: currentData.main.humidity ?? null,
        windSpeedKph: typeof currentData.wind?.speed === "number" ? currentData.wind.speed * 3.6 : null,
        precipitationProbabilityPercent: daily[0]?.precipitationProbabilityPercent ?? null,
        condition: currentData.weather?.[0]?.main ?? null,
      },
      daily,
    };
  } catch {
    return null;
  }
}
