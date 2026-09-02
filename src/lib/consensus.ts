import type { DailyForecast, WeatherReading } from "@/lib/weather-types";

/**
 * Default per-source trust weights for the weighted median/vote.
 * NWS is the authoritative US government source; AccuWeather is a
 * long-established commercial forecaster. Open-Meteo blends several
 * numerical models and has no accuracy track record of its own, so it
 * (and the remaining commercial sources) get the neutral baseline weight.
 * Unlisted sources also fall back to 1 via `weights[source] ?? 1`.
 */
export const DEFAULT_SOURCE_WEIGHTS: Record<string, number> = {
  nws: 1.5,
  accuweather: 1.25,
};

export interface ConsensusCurrent {
  temperatureC: number;
  feelsLikeC: number | null;
  humidityPercent: number | null;
  windSpeedKph: number | null;
  precipitationProbabilityPercent: number | null;
  condition: string | null;
}

export interface ConsensusDaily {
  date: string;
  tempMinC: number;
  tempMaxC: number;
  precipitationProbabilityPercent: number | null;
  condition: string | null;
  sourceCount: number;
}

export interface ConsensusResult {
  current: ConsensusCurrent;
  daily: ConsensusDaily[];
  confidence: number; // 0-1, how much the sources agree
  sourceCount: number;
  sources: string[];
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

export function median(values: number[]): number {
  return weightedMedian(values.map((value) => ({ value, weight: 1 })));
}

export function weightedMedian(items: { value: number; weight: number }[]): number {
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, i) => sum + i.weight, 0);
  let cumulative = 0;
  for (const item of sorted) {
    cumulative += item.weight;
    if (cumulative >= totalWeight / 2) return item.value;
  }
  return sorted[sorted.length - 1]?.value ?? NaN;
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Flags indices whose distance from the median exceeds `threshold` modified
 * z-scores (MAD-based, robust to a small number of divergent sources).
 * Never rejects everything — falls back to all indices if that would happen.
 */
export function rejectOutlierIndices(values: number[], threshold = 3.5): number[] {
  if (values.length <= 2) return values.map((_, i) => i);
  const med = median(values);
  const deviations = values.map((v) => Math.abs(v - med));
  const mad = median(deviations);
  if (mad === 0) return values.map((_, i) => i);

  const kept: number[] = [];
  values.forEach((v, i) => {
    const modifiedZ = (0.6745 * (v - med)) / mad;
    if (Math.abs(modifiedZ) <= threshold) kept.push(i);
  });
  return kept.length > 0 ? kept : values.map((_, i) => i);
}

/**
 * Confidence rises with source agreement (low spread) and source count (3+
 * sources caps the count factor). Agreement falls off linearly to 0 as the
 * spread across sources approaches 5°C.
 */
export function agreementConfidence(values: number[], sourceCount: number): number {
  if (values.length === 0) return 0;
  const agreement = clamp(1 - standardDeviation(values) / 5, 0, 1);
  const countFactor = Math.min(1, sourceCount / 3);
  return round2(clamp(agreement * countFactor, 0, 1));
}

interface SourceValue {
  source: string;
  value: number | null | undefined;
}

function consensusNumeric(
  entries: SourceValue[],
  weights: Record<string, number>,
): { value: number | null; usedSources: string[] } {
  const valid = entries.filter(
    (e): e is { source: string; value: number } => typeof e.value === "number" && !Number.isNaN(e.value),
  );
  if (valid.length === 0) return { value: null, usedSources: [] };

  const values = valid.map((v) => v.value);
  const keptIdx = rejectOutlierIndices(values);
  const kept = keptIdx.map((i) => valid[i]);
  const value = weightedMedian(kept.map((k) => ({ value: k.value, weight: weights[k.source] ?? 1 })));
  return { value, usedSources: kept.map((k) => k.source) };
}

function consensusCondition(
  entries: { source: string; value: string | null }[],
  weights: Record<string, number>,
): string | null {
  const tally = new Map<string, number>();
  for (const e of entries) {
    if (!e.value) continue;
    tally.set(e.value, (tally.get(e.value) ?? 0) + (weights[e.source] ?? 1));
  }
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const [value, score] of tally) {
    if (score > bestScore) {
      bestScore = score;
      best = value;
    }
  }
  return best;
}

export function computeConsensus(
  readings: WeatherReading[],
  weights: Record<string, number> = {},
): ConsensusResult {
  if (readings.length === 0) {
    throw new Error("computeConsensus requires at least one reading");
  }

  const temperature = consensusNumeric(
    readings.map((r) => ({ source: r.source, value: r.current.temperatureC })),
    weights,
  );
  const feelsLike = consensusNumeric(
    readings.map((r) => ({ source: r.source, value: r.current.feelsLikeC })),
    weights,
  );
  const humidity = consensusNumeric(
    readings.map((r) => ({ source: r.source, value: r.current.humidityPercent })),
    weights,
  );
  const wind = consensusNumeric(
    readings.map((r) => ({ source: r.source, value: r.current.windSpeedKph })),
    weights,
  );
  const precip = consensusNumeric(
    readings.map((r) => ({ source: r.source, value: r.current.precipitationProbabilityPercent })),
    weights,
  );
  const condition = consensusCondition(
    readings.map((r) => ({ source: r.source, value: r.current.condition })),
    weights,
  );

  const tempValuesUsed = readings
    .filter((r) => temperature.usedSources.includes(r.source))
    .map((r) => r.current.temperatureC);
  const confidence = agreementConfidence(tempValuesUsed, readings.length);

  const dateSet = new Set<string>();
  readings.forEach((r) => r.daily.forEach((d) => dateSet.add(d.date)));

  const daily: ConsensusDaily[] = Array.from(dateSet)
    .sort()
    .map((date) => {
      const entries = readings
        .map((r) => ({ source: r.source, day: r.daily.find((d) => d.date === date) }))
        .filter((e): e is { source: string; day: DailyForecast } => !!e.day);

      const tempMin = consensusNumeric(
        entries.map((e) => ({ source: e.source, value: e.day.tempMinC })),
        weights,
      );
      const tempMax = consensusNumeric(
        entries.map((e) => ({ source: e.source, value: e.day.tempMaxC })),
        weights,
      );
      const pop = consensusNumeric(
        entries.map((e) => ({ source: e.source, value: e.day.precipitationProbabilityPercent })),
        weights,
      );
      const cond = consensusCondition(
        entries.map((e) => ({ source: e.source, value: e.day.condition })),
        weights,
      );

      return {
        date,
        tempMinC: tempMin.value ?? NaN,
        tempMaxC: tempMax.value ?? NaN,
        precipitationProbabilityPercent: pop.value,
        condition: cond,
        sourceCount: entries.length,
      };
    })
    .filter((d) => !Number.isNaN(d.tempMinC) && !Number.isNaN(d.tempMaxC));

  return {
    current: {
      temperatureC: temperature.value ?? NaN,
      feelsLikeC: feelsLike.value,
      humidityPercent: humidity.value,
      windSpeedKph: wind.value,
      precipitationProbabilityPercent: precip.value,
      condition,
    },
    daily,
    confidence,
    sourceCount: readings.length,
    sources: readings.map((r) => r.source),
  };
}
