import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  OPENWEATHERMAP_API_KEY: z.string().optional(),
  ACCUWEATHER_API_KEY: z.string().optional(),
  WEATHERAPI_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  // Used server-side only (metadata generation), so a plain (non-
  // NEXT_PUBLIC_) var is fine - it's read at request time, not baked into
  // the client bundle at build time. e.g. "https://weather.promptbox.club"
  SITE_URL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

// Validated lazily (on first property access) rather than at import time.
// `next build` executes route modules' top-level code while collecting page
// data, before any real runtime env vars are available (e.g. inside the
// Docker builder stage, which intentionally has no .env) - eager validation
// would fail the build for reasons unrelated to the code being built.
function loadEnv(): Env {
  if (!cached) {
    cached = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY || undefined,
      ACCUWEATHER_API_KEY: process.env.ACCUWEATHER_API_KEY || undefined,
      WEATHERAPI_API_KEY: process.env.WEATHERAPI_API_KEY || undefined,
      SENTRY_DSN: process.env.SENTRY_DSN || undefined,
      SITE_URL: process.env.SITE_URL || undefined,
    });
  }
  return cached;
}

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return loadEnv()[prop as keyof Env];
  },
});
