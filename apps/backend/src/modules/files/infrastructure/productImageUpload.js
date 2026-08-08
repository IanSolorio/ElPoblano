import { randomUUID } from "node:crypto";
import multer from "multer";
import { AppError } from "../../../shared/errors/AppError.js";
import { firebaseBucket } from "../../../shared/storage/firebaseStorage.js";
import { env } from "../../../config/env.js";

const extensions = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"]]);

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 2 },
  fileFilter: (_request, file, callback) => {
    if (!extensions.has(file.mimetype)) return callback(new AppError("Solo se permiten imágenes JPG, PNG o WebP.", 415, "UNSUPPORTED_IMAGE_TYPE"));
    callback(null, true);
  },
});

export const saveImage = async (file, folder = "products") => {
  const hasEnvironmentCredentials = Boolean(
    env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey,
  );

  if (!env.googleApplicationCredentials && !hasEnvironmentCredentials) {
    throw new AppError(
      "Firebase Admin no tiene credenciales. Configura FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.",
      503,
      "FIREBASE_CREDENTIALS_MISSING",
    );
  }
  const objectName = `${folder}/${randomUUID()}${extensions.get(file.mimetype)}`;
  const downloadToken = randomUUID();
  const storageFile = firebaseBucket.file(objectName);
  await storageFile.save(file.buffer, {
    resumable: false,
    metadata: {
      contentType: file.mimetype,
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${firebaseBucket.name}/o/${encodeURIComponent(objectName)}?alt=media&token=${downloadToken}`;
};

export const saveProductImage = (file) => saveImage(file, "products");
