import { Router } from "express";
import { AppError } from "../../../shared/errors/AppError.js";
import { productImageUpload, saveImage } from "../infrastructure/productImageUpload.js";

export const createFileRouter = (authenticate, requireAdmin) => {
  const router = Router();
  const upload = (folder) => async (request, response, next) => {
    try {
      if (!request.file) throw new AppError("Debes seleccionar una imagen.", 400, "IMAGE_REQUIRED");
      response.status(201).json({ url: await saveImage(request.file, folder) });
    } catch (error) { next(error); }
  };
  router.post("/productos", authenticate, requireAdmin, productImageUpload.single("imagen"), upload("products"));
  router.post("/promociones", authenticate, requireAdmin, productImageUpload.single("imagen"), upload("promotions"));
  return router;
};
