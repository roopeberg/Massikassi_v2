import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { MAX_GIF_BYTES, MAX_GIF_DIMENSION } from "./gif-constraints";

export class InvalidGifError extends Error {}

export { MAX_GIF_BYTES, MAX_GIF_DIMENSION };

// A dedicated volume in production (docker-compose.yml), not public/ —
// public/ is baked into the image at build time in the standalone output,
// not meant for files written at runtime.
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

/** Reads the GIF logical screen descriptor directly — no image library needed for this one format. */
function parseGifDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 10) return null;
  const signature = buf.toString("ascii", 0, 6);
  if (signature !== "GIF87a" && signature !== "GIF89a") return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

/** Validates and writes an uploaded GIF, returning its filename under UPLOAD_DIR. */
export async function saveGif(buffer: Buffer): Promise<string> {
  if (buffer.length > MAX_GIF_BYTES) {
    throw new InvalidGifError(`GIF is too large (max ${MAX_GIF_BYTES / 1024 / 1024}MB).`);
  }
  const dimensions = parseGifDimensions(buffer);
  if (!dimensions) {
    throw new InvalidGifError("Not a valid GIF file.");
  }
  if (dimensions.width > MAX_GIF_DIMENSION || dimensions.height > MAX_GIF_DIMENSION) {
    throw new InvalidGifError(`GIF is too large (max ${MAX_GIF_DIMENSION}×${MAX_GIF_DIMENSION}px).`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.gif`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return filename;
}

export async function readGif(filename: string): Promise<Buffer> {
  return readFile(path.join(UPLOAD_DIR, filename));
}

export async function deleteGif(filename: string): Promise<void> {
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // Already gone — fine, deletion is idempotent from the caller's POV.
  }
}

/** Filenames are always our own randomUUID() + ".gif" — reject anything else before touching the filesystem. */
export function isValidGifFilename(filename: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.gif$/.test(filename);
}
