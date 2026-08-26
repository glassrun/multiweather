import { NextResponse } from "next/server";

// Static CSP (not nonce-based): a per-request nonce must be byte-identical
// across every inline script Next.js emits for a given page, including ones
// streamed in later to resolve a Suspense boundary. If a boundary's resolved
// content is flushed as a separate follow-up piece of work, it can end up
// carrying a stale/mismatched nonce, and the browser silently drops that
// script under CSP - which showed up as client hydration randomly never
// completing on pages with real async work (e.g. /weather/[city]) while
// simpler pages were unaffected. A static policy has no per-request value to
// mismatch, at the cost of allowing inline scripts generally rather than
// only framework-issued ones.
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    connect-src 'self';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

export function proxy() {
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
