import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import crypto from "node:crypto";

export const uploadDirectory = path.resolve("uploads/tasks");

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg", ".docx"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExt = allowedExtensions.has(extension) ? extension : "";
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${safeExt}`;
    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
    return cb(
      new Error(
        "Unsupported file type. Only PDF, PNG, JPG, and DOCX files are allowed."
      )
    );
  }
  cb(null, true);
};

export const uploadTaskAttachments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

/**
 * Inspects file magic bytes on disk so spoofed Content-Type / MIME headers are rejected.
 * Deletes any invalid files immediately.
 */
export async function verifyMagicBytes(files: Express.Multer.File[]): Promise<void> {
  const invalidFiles: Express.Multer.File[] = [];

  for (const file of files) {
    try {
      const handle = await fsp.open(file.path, "r");
      const buf = Buffer.alloc(8);
      await handle.read(buf, 0, 8, 0);
      await handle.close();

      const isPdf = buf.subarray(0, 5).toString("ascii") === "%PDF-";
      const isPng =
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a;
      const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
      const isDocxZip = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;

      const ok =
        (file.mimetype === "application/pdf" && isPdf) ||
        (file.mimetype === "image/png" && isPng) ||
        (file.mimetype === "image/jpeg" && isJpeg) ||
        (file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
          isDocxZip);

      if (!ok) {
        invalidFiles.push(file);
      }
    } catch {
      invalidFiles.push(file);
    }
  }

  if (invalidFiles.length > 0) {
    await Promise.all(
      files.map((f) => fsp.unlink(f.path).catch(() => {}))
    );
    throw new Error("Uploaded file content does not match its declared file type.");
  }
}
