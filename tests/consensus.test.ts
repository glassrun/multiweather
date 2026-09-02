import { describe, expect, it } from "vitest";
import {
  agreementConfidence,
  computeConsensus,
  DEFAULT_SOURCE_WEIGHTS,
  median,
  rejectOutlierIndices,
  standardDeviation,
  weightedMedian,
} from "@/lib/consensus";
import type { WeatherReading } from "@/lib/weather-types";

function reading(overrides: {
  source: string;
  temperatureC: number;
  condition?: string | null;
  feelsLikeC?: number | null;
  humidityPercent?: number | null;
  windSpeedKph?: number | null;
  precipitationProbabilityPercent?: number | null;
  daily?: WeatherReading["daily"];
}): WeatherReading {
  return {
    source: overrides.source,
    fetchedAt: new Date().toISOString(),
    current: {
      temperatureC: overrides.temperatureC,
      feelsLikeC: overrides.feelsLikeC ?? null,
      humidityPercent: overrides.humidityPercent ?? null,
      windSpeedKph: overrides.windSpeedKph ?? null,
      precipitationProbabilityPercent: overrides.precipitationProbabilityPercent ?? null,
      condition: overrides.condition ?? null,
    },
    daily: overrides.daily ?? [],
  };
}

describe("math primitives", () => {
  it("median handles odd and even length arrays", () => {
    expect(median([1, 3, 2])).toBe(2);
    // simple (non-interpolated) median: for an even count it returns the
    // element where cumulative weight first reaches half the total, i.e.
    // the lower of the two middle values.
    expect(median([1, 2, 3, 4])).toBe(2);
  });

  it("weightedMedian favors the heavier side", () => {
    const result = weightedMedian([
      { value: 10, weight: 1 },
      { value: 20, weight: 5 },
      { value: 30, weight: 1 },
    ]);
    expect(result).toBe(20);
  });

  it("standardDeviation is zero for identical values", () => {
    expect(standardDeviation([5, 5, 5])).toBe(0);
  });

  it("rejectOutlierIndices keeps everything for 2 or fewer points", () => {
    expect(rejectOutlierIndices([1, 100])).toEqual([0, 1]);
  });

  it("rejectOutlierIndices drops a value far from the pack", () => {
    const kept = rejectOutlierIndices([20, 21, 19, 20, 90]);
    expect(kept).toEqual([0, 1, 2, 3]);
  });

  it("rejectOutlierIndices never rejects everything", () => {
    // All-identical-deviation case (MAD = 0) should short-circuit to "keep all".
    expect(rejectOutlierIndices([10, 20, 30])).toEqual([0, 1, 2]);
  });
});

describe("agreementConfidence", () => {
  it("is low for a single source", () => {
    expect(agreementConfidence([20], 1)).toBeCloseTo(0.33, 2);
  });

  it("is high for several agreeing sources", () => {
    expect(agreementConfidence([20, 20, 20], 3)).toBe(1);
  });

  it("drops as sources disagree", () => {
    const tight = agreementConfidence([20, 21, 19], 3);
    const loose = agreementConfidence([10, 20, 30], 3);
    expect(tight).toBeGreaterThan(loose);
  });
});

describe("computeConsensus", () => {
  it("throws on an empty reading list", () => {
    expect(() => computeConsensus([])).toThrow();
  });

  it("passes a single source straight through with low confidence", () => {
    const result = computeConsensus([reading({ source: "a", temperatureC: 22, condition: "Clear" })]);
    expect(result.current.temperatureC).toBe(22);
    expect(result.current.condition).toBe("Clear");
    expect(result.confidence).toBeCloseTo(0.33, 2);
    expect(result.sourceCount).toBe(1);
  });

  it("takes the weighted-median temperature across agreeing sources", () => {
    const result = computeConsensus([
      reading({ source: "a", temperatureC: 20 }),
      reading({ source: "b", temperatureC: 21 }),
      reading({ source: "c", temperatureC: 22 }),
    ]);
    expect(result.current.temperatureC).toBe(21);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("discards a wildly divergent outlier source from the temperature consensus", () => {
    const result = computeConsensus([
      reading({ source: "a", temperatureC: 20 }),
      reading({ source: "b", temperatureC: 21 }),
      reading({ source: "c", temperatureC: 19 }),
      reading({ source: "broken", temperatureC: 90 }),
    ]);
    expect(result.current.temperatureC).toBeLessThan(25);
  });

  it("excludes a field entirely when no source reports it", () => {
    const result = computeConsensus([
      reading({ source: "a", temperatureC: 20, humidityPercent: null }),
      reading({ source: "b", temperatureC: 21, humidityPercent: null }),
    ]);
    expect(result.current.humidityPercent).toBeNull();
  });

  it("still uses a field when only some sources report it", () => {
    const result = computeConsensus([
      reading({ source: "a", temperatureC: 20, humidityPercent: 50 }),
      reading({ source: "b", temperatureC: 21, humidityPercent: null }),
    ]);
    expect(result.current.humidityPercent).toBe(50);
  });

  it("picks the most-voted condition text", () => {
    const result = computeConsensus([
      reading({ source: "a", temperatureC: 20, condition: "Cloudy" }),
      reading({ source: "b", temperatureC: 20, condition: "Cloudy" }),
      reading({ source: "c", temperatureC: 20, condition: "Sunny" }),
    ]);
    expect(result.current.condition).toBe("Cloudy");
  });

  it("merges daily forecasts across sources by date, keeping dates only some sources cover", () => {
    const result = computeConsensus([
      reading({
        source: "a",
        temperatureC: 20,
        daily: [
          { date: "2026-08-25", tempMinC: 10, tempMaxC: 20, precipitationProbabilityPercent: 10, condition: "Clear" },
          { date: "2026-08-26", tempMinC: 11, tempMaxC: 21, precipitationProbabilityPercent: 20, condition: "Clear" },
        ],
      }),
      reading({
        source: "b",
        temperatureC: 20,
        daily: [
          { date: "2026-08-25", tempMinC: 12, tempMaxC: 22, precipitationProbabilityPercent: 30, condition: "Clear" },
        ],
      }),
    ]);

    expect(result.daily).toHaveLength(2);
    expect(result.daily[0].date).toBe("2026-08-25");
    expect(result.daily[0].sourceCount).toBe(2);
    expect(result.daily[1].date).toBe("2026-08-26");
    expect(result.daily[1].sourceCount).toBe(1);
  });

  it("applies source weights so a trusted source pulls the median toward it", () => {
    const readings = [
      reading({ source: "trusted", temperatureC: 25 }),
      reading({ source: "other-1", temperatureC: 15 }),
      reading({ source: "other-2", temperatureC: 15 }),
    ];
    const unweighted = computeConsensus(readings);
    const weighted = computeConsensus(readings, { trusted: 10 });
    expect(unweighted.current.temperatureC).toBe(15);
    expect(weighted.current.temperatureC).toBe(25);
  });

  it("gives NWS more pull than a neutral-weight source by default", () => {
    const readings = [
      reading({ source: "nws", temperatureC: 25 }),
      reading({ source: "open-meteo", temperatureC: 15 }),
    ];
    const unweighted = computeConsensus(readings);
    const weighted = computeConsensus(readings, DEFAULT_SOURCE_WEIGHTS);
    expect(unweighted.current.temperatureC).toBe(15);
    expect(weighted.current.temperatureC).toBe(25);
  });
});
