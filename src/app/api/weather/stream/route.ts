import { NextRequest } from "next/server";
import { z } from "zod";
import { getWeatherForLocation } from "@/lib/weatherService";

// Never statically cached/prerendered - this is a live, per-connection stream.
export const dynamic = "force-dynamic";

// How often a push goes out to the client. This is intentionally decoupled
// from how often we actually hit the weather providers: getWeatherForLocation
// already serves from the 15-minute Redis cache when it's warm, so most of
// these ticks just re-read that cache (cheap, no provider calls) and only
// roughly 1 in 90 of them lands on an actual expired-cache provider fetch.
// This is what makes the connection feel live without increasing load on
// metered providers like AccuWeather's ~50-call/day free tier.
const DATA_INTERVAL_MS = 10 * 1000;
// Well under typical reverse-proxy idle timeouts (nginx defaults to 60s) so
// the connection doesn't get silently dropped if data pushes ever stall.
const HEARTBEAT_MS = 25 * 1000;

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
  });
  if (!parsed.success) {
    return new Response("Invalid or missing lat/lon", { status: 400 });
  }
  const { lat, lon } = parsed.data;

  const encoder = new TextEncoder();
  let refreshTimer: ReturnType<typeof setInterval>;
  let heartbeatTimer: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = async () => {
        try {
          const result = await getWeatherForLocation(lat, lon);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
        } catch {
          // Skip this cycle - the client keeps showing its last good data
          // rather than being pushed an error over an otherwise-fine stream.
        }
      };

      const cleanup = () => {
        clearInterval(refreshTimer);
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };

      sendUpdate();
      refreshTimer = setInterval(sendUpdate, DATA_INTERVAL_MS);
      heartbeatTimer = setInterval(() => {
        controller.enqueue(encoder.encode(`: keep-alive\n\n`));
      }, HEARTBEAT_MS);

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      clearInterval(refreshTimer);
      clearInterval(heartbeatTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Tells nginx (if fronting this app) not to buffer the response, which
      // would otherwise hold every chunk until the connection closes.
      "X-Accel-Buffering": "no",
    },
  });
}
