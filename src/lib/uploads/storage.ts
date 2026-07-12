import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@/lib/api";

/**
 * Storage abstraction with a local-filesystem adapter for hackathon use.
 * Files are written under `storage/uploads/<subdir>` and served through the
 * protected `/api/files/[...path]` route.
 *
 * To move to S3 later, implement `saveUpload` / `readUpload` against the AWS
 * SDK (PutObject / GetObject) and return an S3 key as `path` + a signed URL —
 * the calling code only depends on the returned `url`/`path` shape.
 */

const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

const EXT_CONTENT_TYPE: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export function maxUploadBytes(): number {
  const mb = Number(process.env.UPLOAD_MAX_SIZE_MB) || 5;
  return mb * 1024 * 1024;
}

export interface StoredFile {
  url: string; // public download URL served by the app
  path: string; // relative path within the storage root
  filename: string;
  size: number;
  contentType: string;
}

export async function saveUpload(file: File, subdir = "proofs"): Promise<StoredFile> {
  const contentType = file.type;
  const ext = ALLOWED[contentType];
  if (!ext) {
    throw new HttpError(400, "Unsupported file type. Allowed: PDF, PNG, JPG.");
  }
  const max = maxUploadBytes();
  if (file.size > max) {
    throw new HttpError(
      400,
      `File too large. Maximum ${(max / 1024 / 1024).toFixed(0)}MB.`,
    );
  }

  // Never trust the original filename — generate a unique, safe one.
  const safeSubdir = subdir.replace(/[^a-z0-9_-]/gi, "");
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(STORAGE_ROOT, safeSubdir);
  await mkdir(dir, { recursive: true });
  const absPath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  const relPath = `${safeSubdir}/${filename}`;
  return {
    url: `/api/files/${relPath}`,
    path: relPath,
    filename,
    size: file.size,
    contentType,
  };
}

export async function readUpload(
  relPath: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  // Prevent path traversal.
  const normalized = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absPath = path.join(STORAGE_ROOT, normalized);
  if (!absPath.startsWith(STORAGE_ROOT)) {
    throw new HttpError(400, "Invalid file path.");
  }
  try {
    const buffer = await readFile(absPath);
    const ext = path.extname(absPath).slice(1).toLowerCase();
    return { buffer, contentType: EXT_CONTENT_TYPE[ext] ?? "application/octet-stream" };
  } catch {
    throw new HttpError(404, "File not found.");
  }
}
