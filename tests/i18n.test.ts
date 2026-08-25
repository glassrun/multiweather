import { describe, expect, it } from "vitest";
import { detectLocaleFromAcceptLanguage } from "@/lib/i18n";

describe("detectLocaleFromAcceptLanguage", () => {
  it("defaults to English when there is no header", () => {
    expect(detectLocaleFromAcceptLanguage(null)).toBe("en");
    expect(detectLocaleFromAcceptLanguage(undefined)).toBe("en");
    expect(detectLocaleFromAcceptLanguage("")).toBe("en");
  });

  it("picks the only supported language present", () => {
    expect(detectLocaleFromAcceptLanguage("el-GR,el;q=0.9")).toBe("el");
    expect(detectLocaleFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
  });

  it("respects q-value weighting over list position", () => {
    // Greek listed first but weighted lower than English - English should win.
    expect(detectLocaleFromAcceptLanguage("el;q=0.3,en;q=0.9")).toBe("en");
    // English listed first but weighted lower than Greek - Greek should win.
    expect(detectLocaleFromAcceptLanguage("en;q=0.5,el;q=0.9")).toBe("el");
  });

  it("falls through unsupported languages to the next supported one", () => {
    expect(detectLocaleFromAcceptLanguage("fr;q=1.0,el;q=0.5")).toBe("el");
    expect(detectLocaleFromAcceptLanguage("fr-FR,de-DE;q=0.9")).toBe("en");
  });

  it("matches on the base language, ignoring region subtags", () => {
    expect(detectLocaleFromAcceptLanguage("el-CY;q=0.8")).toBe("el");
  });

  it("treats a missing or malformed q as full priority (1)", () => {
    expect(detectLocaleFromAcceptLanguage("el,en;q=0.9")).toBe("el");
    expect(detectLocaleFromAcceptLanguage("el;q=notanumber,en;q=0.9")).toBe("el");
  });
});
