import axios from "axios";

const API_URL = import.meta.env.VITE_ENDPOINT_BASE || "http://localhost:3000/api";

const optimizeImage = async (image) => {
  if (!image.type.startsWith("image/") || image.type === "image/svg+xml") return image;

  const bitmap = await createImageBitmap(image);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("No se pudo optimizar la imagen.")), "image/webp", 0.82);
  });

  if (blob.size >= image.size) return image;
  const baseName = image.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
};

export const uploadFile = async (image, onProgress) => {
  const optimizedImage = await optimizeImage(image);
  const formData = new FormData();
  formData.append("imagen", optimizedImage);
  try {
    const { data } = await axios.post(`${API_URL}/archivos/productos`, formData, {
      withCredentials: true,
      timeout: 30000,
      onUploadProgress: ({ loaded, total }) => {
        if (total) onProgress?.(Math.round((loaded * 100) / total));
      },
    });
    return data.url;
  } catch (error) {
    throw new Error(error.response?.data?.message || "No se pudo subir la imagen a Firebase Storage.");
  }
};

export const deleteFile = async () => undefined;
