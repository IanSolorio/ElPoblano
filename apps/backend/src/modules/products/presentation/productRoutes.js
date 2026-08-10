import { Router } from "express";
import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.js";

const productSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  descripcion: z.string().trim().min(1).max(5000),
  categoriaId: z.coerce.number().int().positive(),
  precio: z.coerce.number().nonnegative().max(99999999.99),
  imagen: z.url().or(z.literal("")).optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  activo: z.boolean().optional(),
});

export const createProductRouter = (productService, authenticate, requireAdmin) => {
  const router = Router();

  router.get("/", async (_request, response, next) => {
    try { response.json(await productService.list()); } catch (error) { next(error); }
  });

  router.get("/admin/todos", authenticate, requireAdmin, async (_request, response, next) => {
    try { response.json(await productService.listAdmin()); } catch (error) { next(error); }
  });

  router.get("/:id", async (request, response, next) => {
    try { response.json(await productService.getById(request.params.id)); } catch (error) { next(error); }
  });

  router.post("/", authenticate, requireAdmin, validate(productSchema), async (request, response, next) => {
    try { response.status(201).json(await productService.create(request.body, request.user)); } catch (error) { next(error); }
  });

  router.put("/:id", authenticate, requireAdmin, validate(productSchema), async (request, response, next) => {
    try { response.json(await productService.update(request.params.id, request.body, request.user)); } catch (error) { next(error); }
  });

  router.delete("/:id", authenticate, requireAdmin, async (request, response, next) => {
    try { response.json(await productService.delete(request.params.id, request.user)); } catch (error) { next(error); }
  });

  return router;
};
