# Weather Consensus

A multi-user app that pulls current conditions and a 7-day forecast from several
weather providers for any searched location, and reports a **consensus**: a
weighted-median, outlier-resistant "most likely" reading with a source-agreement
confidence score, plus a per-source breakdown for transparency.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Zod · Next-Auth (Credentials + JWT)
· PostgreSQL + Prisma · Redis · Vitest · Playwright · CSP (nonce-based, via `proxy.ts`)

## Weather sources

| Source | Key required? | Notes |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com/) | No | Free, always on. Also used for geocoding. |
| [NWS](https://www.weather.gov/documentation/services-web-api) | No | Free, US locations only. |
| [OpenWeatherMap](https://openweathermap.org/api) | Yes | Free tier: 1,000 calls/day. |
| [AccuWeather](https://developer.accuweather.com/) | Yes | Free tier is low-volume (~50 calls/day). |
| [WeatherAPI.com](https://www.weatherapi.com/) | Yes | Free tier. Stands in for Weather Underground, whose public API is no longer available for new signups (enterprise-only now). |

Any provider without a configured API key is skipped automatically — the app works
fine with just the two free/no-key sources.

## Getting started

1. Start Postgres and Redis:

   ```bash
   docker compose up -d
   ```

2. Copy the env file and fill in what you have (see the table above for optional keys):

   ```bash
   cp .env.example .env
   # generate AUTH_SECRET with: openssl rand -base64 32
   ```

3. Install dependencies and set up the database:

   ```bash
   npm install
   npm run db:migrate
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test          # Vitest unit tests (consensus math, provider normalization)
npm run test:e2e  # Playwright end-to-end (requires: npx playwright install chromium)
npm run lint
npx tsc --noEmit
```

## How the consensus is computed

See `src/lib/consensus.ts`. For each numeric field (temperature, humidity, wind,
precipitation chance), sources are combined with a weighted median after discarding
statistical outliers (MAD-based, so one broken/divergent source can't skew the
result). Condition text uses a weighted vote. The confidence score reflects both how
tightly the sources agree and how many sources contributed.

## Cost control

Weather lookups are fetched on demand for whatever location is searched and cached
in Redis (~15 min TTL) — there is no background job continuously polling arbitrary
searched locations against the paid providers. An optional, opt-in job could refresh
a signed-in user's own saved locations on a schedule, but nothing does so by default.
