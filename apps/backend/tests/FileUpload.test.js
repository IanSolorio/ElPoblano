import assert from "node:assert/strict";
import test from "node:test";
import { getImageExtension, imageUploadLimits, saveImage } from "../src/modules/files/infrastructure/productImageUpload.js";

test("UT-FILE-01: acepta extensiones JPG, PNG y WebP", () => {
  assert.equal(getImageExtension("image/jpeg"), ".jpg"); assert.equal(getImageExtension("image/png"), ".png"); assert.equal(getImageExtension("image/webp"), ".webp");
});

test("UT-FILE-02: rechaza tipos no admitidos con 415", () => {
  assert.throws(() => getImageExtension("application/pdf"), { code: "UNSUPPORTED_IMAGE_TYPE", status: 415 });
});

test("UT-FILE-03: limita tamaño, archivos, campos y partes", () => {
  assert.deepEqual(imageUploadLimits, { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 2 });
});

test("UT-FILE-04: Firebase sin credenciales devuelve error controlado", async () => {
  await assert.rejects(saveImage({ mimetype: "image/jpeg", buffer: Buffer.from("x") }, "products", { hasCredentials: false }), { code: "FIREBASE_CREDENTIALS_MISSING", status: 503 });
});

test("UT-FILE-05: construye objeto Firebase con UUID, carpeta, MIME, caché y token", async () => {
  let objectName; let saved; const bucket = { name: "bucket.test", file: (name) => { objectName = name; return { save: async (buffer, options) => { saved = { buffer, options }; } }; } };
  const url = await saveImage({ mimetype: "image/webp", buffer: Buffer.from("image") }, "promotions", { hasCredentials: true, bucket });
  assert.match(objectName, /^promotions\/[0-9a-f-]{36}\.webp$/); assert.equal(saved.options.resumable, false); assert.equal(saved.options.metadata.contentType, "image/webp"); assert.equal(saved.options.metadata.cacheControl, "public, max-age=31536000, immutable"); assert.match(saved.options.metadata.metadata.firebaseStorageDownloadTokens, /^[0-9a-f-]{36}$/); assert.match(url, /^https:\/\/firebasestorage\.googleapis\.com/);
});
