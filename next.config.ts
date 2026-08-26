import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Security headers (including CSP with a per-request nonce) are set in proxy.ts */

  // Allows the dev server's JS bundles/HMR to load when the app is opened via
  // its LAN IP instead of localhost (e.g. testing from another device).
  allowedDevOrigins: ["192.168.2.7"],

  // NOT using output: "standalone" - its bundled server.js never completes
  // the streaming SSR response for routes with a Suspense boundary that has
  // real async work (our /weather/[city], which has a loading.tsx and awaits
  // multiple provider fetches): the boundary's resolved content just never
  // gets flushed, so client hydration silently never happens for that
  // subtree. Confirmed reproducible with `node .next/standalone/server.js`
  // and absent with plain `next start` on the exact same build. Costs a
  // larger Docker image (full node_modules instead of the traced subset),
  // which is the right trade for correctness here.
};

export default nextConfig;
