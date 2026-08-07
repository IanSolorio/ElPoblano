import { Router } from "express";
import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.js";

const paymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentData: z.object({
    token: z.string().min(1).optional(),
    payment_method_id: z.string().min(1).max(50),
    issuer_id: z.union([z.string(), z.number()]).optional(),
    installments: z.coerce.number().int().min(1).max(48).optional(),
    payer: z.object({
      identification: z.object({ type: z.string().max(20), number: z.string().max(30) }).optional(),
    }).passthrough().optional(),
  }).passthrough(),
});

export const createPaymentRouter = (paymentService, authenticate) => {
  const router = Router();
  router.post("/mercadopago", authenticate, validate(paymentSchema), async (request, response, next) => {
    try {
      const order = await paymentService.process(request.user, request.body, request.get("Idempotency-Key"));
      response.json(order);
    } catch (error) { next(error); }
  });
  router.post("/webhook", async (request, response, next) => {
    try {
      const paymentId = request.body?.data?.id || request.query["data.id"];
      if (paymentId) await paymentService.synchronize(paymentId);
      response.sendStatus(200);
    } catch (error) { next(error); }
  });
  return router;
};
