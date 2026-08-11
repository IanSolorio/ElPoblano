import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.js";
import { env } from "../../../config/env.js";
import { extractSessionToken } from "./authMiddleware.js";

const registerSchema = z.object({
  email: z.email().max(191),
  password: z.string().min(10).max(128),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).optional(),
  address: z.object({
    label: z.string().trim().min(1).max(50).default("Casa"),
    addressLine: z.string().trim().min(5).max(255),
    reference: z.string().trim().max(255).optional(),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  }),
});
const loginSchema = z.object({ email: z.email().max(191), password: z.string().min(1).max(128) });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: env.authRateLimit, standardHeaders: "draft-8", legacyHeaders: false });

export const createAuthRouter = (authService, authenticate, cookieOptions) => {
  const router = Router();
  const setSession = (response, result) => {
    response.cookie("elpoblano_session", result.token, { ...cookieOptions, expires: result.expiresAt });
    return { user: result.user, expiresAt: result.expiresAt };
  };

  router.post("/registro", authLimiter, validate(registerSchema), async (request, response, next) => {
    try { response.status(201).json(setSession(response, await authService.register(request.body))); } catch (error) { next(error); }
  });
  router.post("/login", authLimiter, validate(loginSchema), async (request, response, next) => {
    try { response.json(setSession(response, await authService.login(request.body.email, request.body.password))); } catch (error) { next(error); }
  });
  router.post("/logout", async (request, response, next) => {
    try {
      await authService.logout(extractSessionToken(request));
      response.clearCookie("elpoblano_session", cookieOptions).status(204).end();
    } catch (error) { next(error); }
  });
  router.get("/me", authenticate, (request, response) => response.json(request.user));
  return router;
};
