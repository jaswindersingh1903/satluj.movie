import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function resolveVersion(): string {
  // Cloudflare Pages exposes the deployed commit; fall back to local git.
  const sha =
    process.env.CF_PAGES_COMMIT_SHA ??
    (() => {
      try {
        return execSync("git rev-parse --short HEAD").toString().trim();
      } catch {
        return "unknown";
      }
    })();
  return sha.slice(0, 7);
}

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: resolveVersion(),
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
  },
};

export default nextConfig;
