import { Router } from "express";
import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.js";

const schema = z.object({
  name: z.string().trim().min(1).max(150), description: z.string().trim().max(5000).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]), discountValue: z.coerce.number().positive(),
  startsAt: z.iso.datetime(), endsAt: z.iso.datetime(), active: z.boolean().default(true),
  productIds: z.array(z.string().uuid()).min(1).max(100),
});

export const createPromotionRouter = (service, authenticate, requireAdmin) => {
  const router = Router();
  router.get("/", async (_request, response, next) => { try { response.json(await service.listActive()); } catch (error) { next(error); } });
  router.get("/admin", authenticate, requireAdmin, async (_request, response, next) => { try { response.json(await service.listAdmin()); } catch (error) { next(error); } });
  router.post("/", authenticate, requireAdmin, validate(schema), async (request, response, next) => { try { response.status(201).json(await service.create(request.body, request.user)); } catch (error) { next(error); } });
  router.put("/:id", authenticate, requireAdmin, validate(schema), async (request, response, next) => { try { response.json(await service.update(request.params.id, request.body, request.user)); } catch (error) { next(error); } });
  router.delete("/:id", authenticate, requireAdmin, async (request, response, next) => { try { response.json(await service.remove(request.params.id, request.user)); } catch (error) { next(error); } });
  return router;
};
