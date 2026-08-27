/**
 * Shared between client (PaymentForm, for immediate feedback) and server
 * (lib/gif.ts, the authoritative check) — kept in its own file since it must
 * not pull in Node built-ins (fs, crypto) that lib/gif.ts uses, which would
 * bloat/break the client bundle.
 *
 * Kept deliberately small — this is a self-hosted single-machine app with no
 * CDN or image pipeline. Linking an externally-hosted GIF instead was
 * considered and rejected: it would leak every viewer's IP to whatever host
 * serves it, the one third-party exposure this project avoids everywhere
 * else. 2MB / 800px keeps a reaction-gif-sized attachment cheap to store and
 * quick to load on a phone.
 */
export const MAX_GIF_BYTES = 2 * 1024 * 1024;
export const MAX_GIF_DIMENSION = 800;
