import { Router } from "express";
import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.js";

const createOrderSchema = z.object({
  items: z.array(z.union([
    z.object({ productId: z.string().uuid(), quantity: z.coerce.number().int().min(1).max(99) }).strict(),
    z.object({ promotionId: z.string().uuid(), quantity: z.coerce.number().int().min(1).max(99) }).strict(),
  ])).min(1).max(50),
  paymentMethod: z.enum(["YAPE", "CREDIT_CARD", "DEBIT_CARD"]),
  phone: z.string().trim().max(30).optional(),
  addressId: z.string().uuid(),
  notes: z.string().trim().max(1000).optional(),
});
const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(10) });

export const createOrderRouter = (orderService, authenticate) => {
  const router = Router();
  router.use(authenticate);
  router.post("/", validate(createOrderSchema), async (request, response, next) => {
    try {
      const order = await orderService.create(request.user, request.body, request.get("Idempotency-Key"));
      response.status(201).json(order);
    } catch (error) { next(error); }
  });
  router.get("/historial", validate(paginationSchema, "query"), async (request, response, next) => {
    try { response.json(await orderService.history(request.user.id, request.validated.query)); } catch (error) { next(error); }
  });
  router.get("/:id", async (request, response, next) => {
    try { response.json(await orderService.getById(request.user.id, request.params.id)); } catch (error) { next(error); }
  });
  return router;
};
