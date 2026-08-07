import { Router } from "express";
import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.js";

const createSchema = z.object({ nombre: z.string().trim().min(2).max(100) }).transform(({ nombre }) => ({ name: nombre }));
const updateSchema = z.object({ nombre: z.string().trim().min(2).max(100).optional(), activo: z.boolean().optional() }).refine((data) => data.nombre !== undefined || data.activo !== undefined);

export const createCategoryRouter = (service, authenticate, requireSuperAdmin) => {
  const router = Router();
  router.get("/", async (_request, response, next) => { try { response.json(await service.listActive()); } catch (error) { next(error); } });
  router.get("/admin", authenticate, requireSuperAdmin, async (_request, response, next) => { try { response.json(await service.listAdmin()); } catch (error) { next(error); } });
  router.post("/", authenticate, requireSuperAdmin, validate(createSchema), async (request, response, next) => { try { response.status(201).json(await service.create(request.body, request.user)); } catch (error) { next(error); } });
  router.patch("/:id", authenticate, requireSuperAdmin, validate(updateSchema), async (request, response, next) => { try { response.json(await service.update(Number(request.params.id), request.body, request.user)); } catch (error) { next(error); } });
  return router;
};
