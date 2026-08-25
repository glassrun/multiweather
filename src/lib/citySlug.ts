// Encodes a location as a single URL path segment that is both SEO-friendly
// (readable, keyword-rich) and exact (round-trips the precise coordinates,
// unlike a name-only slug which can't disambiguate e.g. "Paris, France" vs
// "Paris, Texas"). Format: "<slugified-name-parts>@<lat>,<lon>", where each
// comma-separated part of the original label becomes its own hyphenated
// segment joined by "--", so the label can be reasonably reconstructed for
// a direct/organic visit that has no other context.
//
// Example: "Athens, Attica, Greece" @ 37.9838, 23.7275
//       -> "athens--attica--greece@37.9838,23.7275"

function slugifyPart(part: string): string {
  return part
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCaseWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function slugifyLabel(label: string): string {
  return label
    .split(",")
    .map(slugifyPart)
    .filter(Boolean)
    .join("--");
}

export function labelFromSlug(slug: string): string {
  return slug
    .split("--")
    .map((part) => part.split("-").filter(Boolean).map(titleCaseWord).join(" "))
    .filter(Boolean)
    .join(", ");
}

export function buildCityParam(label: string, latitude: number, longitude: number): string {
  return `${slugifyLabel(label)}@${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

export interface ParsedCityParam {
  slug: string;
  latitude: number;
  longitude: number;
}

export function parseCityParam(param: string): ParsedCityParam | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(param);
  } catch {
    return null;
  }

  const atIndex = decoded.lastIndexOf("@");
  if (atIndex <= 0) return null;

  const slug = decoded.slice(0, atIndex);
  const [latStr, lonStr] = decoded.slice(atIndex + 1).split(",");
  const latitude = Number(latStr);
  const longitude = Number(lonStr);

  if (!slug || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { slug, latitude, longitude };
}
