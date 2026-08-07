import { Router } from "express";
import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.js";

const pagination = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20), role: z.enum(["CUSTOMER", "ADMIN", "SUPER_ADMIN"]).optional(), search: z.string().trim().max(100).optional() });
const update = z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100), phone: z.string().trim().max(30).optional() });
const createAdmin = update.extend({ email: z.email().max(191), password: z.string().min(10).max(128) });
const status = z.object({ active: z.boolean() });

export const createAdminUserRouter = (service, authenticate, requireAdmin) => {
  const router = Router(); router.use(authenticate, requireAdmin);
  router.get("/", validate(pagination, "query"), async (request, response, next) => { try { response.json(await service.list(request.validated.query)); } catch (error) { next(error); } });
  router.post("/administradores", validate(createAdmin), async (request, response, next) => { try { response.status(201).json(await service.createAdmin(request.body, request.user)); } catch (error) { next(error); } });
  router.put("/:id", validate(update), async (request, response, next) => { try { response.json(await service.update(request.params.id, request.body, request.user)); } catch (error) { next(error); } });
  router.patch("/:id/status", validate(status), async (request, response, next) => { try { response.json(await service.setStatus(request.params.id, request.body.active, request.user)); } catch (error) { next(error); } });
  router.delete("/:id", async (request, response, next) => { try { response.json(await service.remove(request.params.id, request.user)); } catch (error) { next(error); } });
  return router;
};
