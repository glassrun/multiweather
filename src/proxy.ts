import { NextResponse } from "next/server";

// Static CSP rather than nonce-based. A per-request nonce was tried and
// suspected as the cause of an intermittent hydration failure on slower
// pages, but that turned out to be a red herring - this file was sitting at
// the project root instead of src/proxy.ts (required once a src/ dir is in
// use), so it was never actually running in any production build regardless
// of its content. Kept static now anyway since there's no concrete need for
// per-script nonces here, and it's one less moving part.
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
