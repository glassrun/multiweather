import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Security headers (including CSP with a per-request nonce) are set in proxy.ts */

  // Allows the dev server's JS bundles/HMR to load when the app is opened via
  // its LAN IP instead of localhost (e.g. testing from another device).
  allowedDevOrigins: ["192.168.2.7"],

  // Produces a minimal, self-contained .next/standalone build (only the
  // traced files it actually needs) for a small production Docker image.
  output: "standalone",
};

export default nextConfig;
