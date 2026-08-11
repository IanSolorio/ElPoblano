import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));

import { deleteFile, uploadFile } from "../src/modules/catalog/infrastructure/imageStorage.js";
import { nameFielUUID } from "../src/shared/utils/file.js";

describe("archivos de productos", () => {
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("UT-FE-34: sube archivos conservando recursos no optimizables y reporta progreso", async () => {
    const file = new File(["documento"], "ficha.txt", { type: "text/plain" });
    const progress = vi.fn();
    axios.post.mockImplementation(async (_url, formData, config) => {
      expect(formData.get("imagen")).toBe(file);
      config.onUploadProgress({ loaded: 5, total: 10 });
      config.onUploadProgress({ loaded: 5, total: 0 });
      return { data: { url: "https://storage/ficha.txt" } };
    });
    await expect(uploadFile(file, progress, "documentos")).resolves.toBe("https://storage/ficha.txt");
    expect(progress).toHaveBeenCalledWith(50);
    expect(axios.post.mock.calls[0][0]).toContain("/archivos/documentos");
    await expect(deleteFile("https://storage/ficha.txt")).resolves.toBeUndefined();
  });

  it("UT-FE-35: reduce imágenes grandes a WebP antes de enviarlas", async () => {
    const bitmap = { width: 3200, height: 1600, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn() }),
      toBlob: (callback) => callback(new Blob(["x"], { type: "image/webp" })),
    };
    vi.spyOn(document, "createElement").mockImplementation((tag) => tag === "canvas" ? canvas : originalCreateElement(tag));
    const image = new File(["x".repeat(100)], "taco.jpg", { type: "image/jpeg" });
    axios.post.mockImplementation(async (_url, formData) => {
      const optimized = formData.get("imagen");
      expect(optimized.name).toBe("taco.webp");
      expect(optimized.type).toBe("image/webp");
      return { data: { url: "https://storage/taco.webp" } };
    });
    await expect(uploadFile(image)).resolves.toBe("https://storage/taco.webp");
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(800);
    expect(bitmap.close).toHaveBeenCalled();
  });

  it("UT-FE-36: informa expiración de sesión y errores del almacenamiento", async () => {
    const image = new File(["svg"], "logo.svg", { type: "image/svg+xml" });
    axios.post.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(uploadFile(image)).rejects.toThrow("Tu sesión expiró");
    axios.post.mockRejectedValueOnce({ response: { status: 500, data: { message: "Bucket no disponible" } } });
    await expect(uploadFile(image)).rejects.toThrow("Bucket no disponible");
    axios.post.mockRejectedValueOnce(new Error("red"));
    await expect(uploadFile(image)).rejects.toThrow("No se pudo subir la imagen");
  });

  it("UT-FE-37: genera nombres únicos conservando la extensión", () => {
    const first = nameFielUUID("producto.jpg");
    const second = nameFielUUID("producto.jpg");
    expect(first).toMatch(/^[0-9a-f-]{36}\.jpg$/i);
    expect(second).not.toBe(first);
  });
});
