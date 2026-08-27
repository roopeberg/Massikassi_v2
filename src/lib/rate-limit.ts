import { NextResponse } from "next/server";

/**
 * A plain in-memory, per-process rate limiter — deliberately not Redis-backed.
 * This app runs as a single long-lived Node process (see DEPLOY.md), so a
 * module-level Map is enough; it would need a shared store the moment this
 * ran as more than one instance.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Sweep expired entries periodically so long-lived processes don't
// accumulate one entry per IP forever.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  },
  5 * 60 * 1000,
).unref();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count++;
  return { ok: true };
}

/** Best-effort client IP behind Caddy's reverse_proxy (sets X-Forwarded-For). */
export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequestsResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Liikaa pyyntöjä, yritä hetken kuluttua uudelleen." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
