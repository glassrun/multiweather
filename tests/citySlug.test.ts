import { describe, expect, it } from "vitest";
import { buildCityParam, labelFromSlug, parseCityParam, slugifyLabel } from "@/lib/citySlug";

describe("slugifyLabel / labelFromSlug", () => {
  it("round-trips a typical multi-part label", () => {
    const slug = slugifyLabel("Athens, Attica, Greece");
    expect(slug).toBe("athens--attica--greece");
    expect(labelFromSlug(slug)).toBe("Athens, Attica, Greece");
  });

  it("round-trips a single-part label", () => {
    const slug = slugifyLabel("London");
    expect(labelFromSlug(slug)).toBe("London");
  });

  it("keeps non-Latin scripts intact", () => {
    const slug = slugifyLabel("Θεσσαλονίκη, Κεντρική Μακεδονία, Ελλάδα");
    expect(labelFromSlug(slug)).toBe("Θεσσαλονίκη, Κεντρική Μακεδονία, Ελλάδα");
  });
});

describe("buildCityParam / parseCityParam", () => {
  it("round-trips coordinates, including negative longitude", () => {
    const param = buildCityParam("New York, New York, United States", 40.71427, -74.00597);
    const parsed = parseCityParam(param);
    expect(parsed).toEqual({
      slug: "new-york--new-york--united-states",
      latitude: 40.7143,
      longitude: -74.006,
    });
  });

  it("rejects a param with no coordinates", () => {
    expect(parseCityParam("athens-attica-greece")).toBeNull();
  });

  it("rejects out-of-range coordinates", () => {
    expect(parseCityParam("nowhere@200,0")).toBeNull();
    expect(parseCityParam("nowhere@0,-200")).toBeNull();
  });

  it("rejects garbage coordinate text", () => {
    expect(parseCityParam("nowhere@abc,def")).toBeNull();
  });
});
