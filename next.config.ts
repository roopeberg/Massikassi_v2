import type { NextConfig } from "next";

// Baseline security headers. Note the CSP allows 'unsafe-inline' for
// script/style — real hardening would thread a per-request nonce through
// Next's middleware, which is a bigger change than this pass covers. This
// still blocks framing (clickjacking) and other-origin script/object
// injection, which is the bulk of the benefit for the size of the app.
// React's development build uses eval() for debugging features (reconstructing
// callstacks across environments); without 'unsafe-eval' it can't, and `next
// dev` surfaces that as a permanent error in the dev overlay. Production React
// never calls eval, so this widens the policy in dev only — the deployed CSP is
// unchanged.
const devOnlyScriptSrc = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
      `script-src 'self' 'unsafe-inline'${devOnlyScriptSrc}; ` +
      "base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
  },
];

// The event hash in the URL is the only access control this app has — if a
// crawler ever indexed/cached one, that link would be effectively public
// forever. Belt-and-suspenders: both the HTTP header (works for the API
// responses too, which aren't HTML so a <meta> tag wouldn't apply) and the
// page's own metadata.robots (src/app/event/[hash]/page.tsx) say no.
const noIndexHeader = { key: "X-Robots-Tag", value: "noindex, nofollow" };

const nextConfig: NextConfig = {
  // Lean, self-contained build for the Docker image (docker-compose.yml).
  output: "standalone",

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/event/:path*", headers: [noIndexHeader] },
      { source: "/api/events/:path*", headers: [noIndexHeader] },
    ];
  },
};

export default nextConfig;
