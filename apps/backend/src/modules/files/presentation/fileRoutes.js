import { Router } from "express";
import { AppError } from "../../../shared/errors/AppError.js";
import { productImageUpload, saveProductImage } from "../infrastructure/productImageUpload.js";

export const createFileRouter = (authenticate, requireAdmin) => {
  const router = Router();
  router.post("/productos", authenticate, requireAdmin, productImageUpload.single("imagen"), async (request, response, next) => {
    try {
      if (!request.file) throw new AppError("Debes seleccionar una imagen.", 400, "IMAGE_REQUIRED");
      response.status(201).json({ url: await saveProductImage(request.file) });
    } catch (error) { next(error); }
  });
  return router;
};
