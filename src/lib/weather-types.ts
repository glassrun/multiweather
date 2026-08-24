import { z } from "zod";

export const DailyForecastSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  tempMinC: z.number(),
  tempMaxC: z.number(),
  precipitationProbabilityPercent: z.number().nullable(),
  condition: z.string().nullable(),
});
export type DailyForecast = z.infer<typeof DailyForecastSchema>;

export const WeatherReadingSchema = z.object({
  source: z.string(),
  fetchedAt: z.string(),
  current: z.object({
    temperatureC: z.number(),
    feelsLikeC: z.number().nullable(),
    humidityPercent: z.number().nullable(),
    windSpeedKph: z.number().nullable(),
    precipitationProbabilityPercent: z.number().nullable(),
    condition: z.string().nullable(),
  }),
  daily: z.array(DailyForecastSchema),
});
export type WeatherReading = z.infer<typeof WeatherReadingSchema>;

export interface GeocodeResult {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}
