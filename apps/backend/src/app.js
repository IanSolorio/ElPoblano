import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import { AuthService } from "./modules/auth/application/AuthService.js";
import { PrismaAuthRepository } from "./modules/auth/infrastructure/PrismaAuthRepository.js";
import { passwordHasher } from "./modules/auth/infrastructure/passwordHasher.js";
import { createAuthenticationMiddleware, requireAdmin, requireSuperAdmin } from "./modules/auth/presentation/authMiddleware.js";
import { CategoryService } from "./modules/categories/application/CategoryService.js";
import { PrismaCategoryRepository } from "./modules/categories/infrastructure/PrismaCategoryRepository.js";
import { createCategoryRouter } from "./modules/categories/presentation/categoryRoutes.js";
import { createAuthRouter } from "./modules/auth/presentation/authRoutes.js";
import { AdminUserService } from "./modules/admin/application/AdminUserService.js";
import { PrismaAdminUserRepository } from "./modules/admin/infrastructure/PrismaAdminUserRepository.js";
import { createAdminUserRouter } from "./modules/admin/presentation/adminUserRoutes.js";
import { OrderService } from "./modules/orders/application/OrderService.js";
import { PrismaOrderRepository } from "./modules/orders/infrastructure/PrismaOrderRepository.js";
import { createOrderRouter } from "./modules/orders/presentation/orderRoutes.js";
import { createFileRouter } from "./modules/files/presentation/fileRoutes.js";
import { PromotionService } from "./modules/promotions/application/PromotionService.js";
import { PrismaPromotionRepository } from "./modules/promotions/infrastructure/PrismaPromotionRepository.js";
import { createPromotionRouter } from "./modules/promotions/presentation/promotionRoutes.js";
import { ProductService } from "./modules/products/application/ProductService.js";
import { PrismaProductRepository } from "./modules/products/infrastructure/PrismaProductRepository.js";
import { createProductRouter } from "./modules/products/presentation/productRoutes.js";
import { PaymentService } from "./modules/payments/application/PaymentService.js";
import { createPaymentRouter } from "./modules/payments/presentation/paymentRoutes.js";
import { prisma } from "./shared/database/prisma.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { requestContext } from "./shared/middleware/requestContext.js";

export const createApp = () => {
  const app = express();
  const authService = new AuthService(new PrismaAuthRepository(prisma), passwordHasher, env.sessionDurationDays);
  const authenticate = createAuthenticationMiddleware(authService);
  const productService = new ProductService(new PrismaProductRepository(prisma));
  const categoryService = new CategoryService(new PrismaCategoryRepository(prisma));
  const orderService = new OrderService(new PrismaOrderRepository(prisma));
  const paymentService = new PaymentService(orderService.repository, env.mercadoPagoAccessToken, env.mercadoPagoNotificationUrl);
  const promotionService = new PromotionService(new PrismaPromotionRepository(prisma));
  const adminUserService = new AdminUserService(new PrismaAdminUserRepository(prisma), passwordHasher);
  const cookieOptions = { httpOnly: true, secure: env.nodeEnv === "production", sameSite: "lax", path: "/" };

  app.disable("x-powered-by");
  app.set("trust proxy", env.nodeEnv === "production" ? 1 : false);
  app.use(requestContext);
  app.use(helmet());
  app.use(cors({ origin: env.frontendOrigin, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));

  app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
  app.get("/api/ready", async (_request, response, next) => {
    try { await prisma.$queryRaw`SELECT 1`; response.json({ status: "ready", database: "connected" }); } catch (error) { next(error); }
  });
  app.use("/api/auth", createAuthRouter(authService, authenticate, cookieOptions));
  app.use("/api/productos", createProductRouter(productService, authenticate, requireAdmin));
  app.use("/api/categorias", createCategoryRouter(categoryService, authenticate, requireSuperAdmin));
  app.use("/api/pedidos", createOrderRouter(orderService, authenticate, requireAdmin));
  app.use("/api/pagos", createPaymentRouter(paymentService, authenticate));
  app.use("/api/archivos", createFileRouter(authenticate, requireAdmin));
  app.use("/api/promociones", createPromotionRouter(promotionService, authenticate, requireAdmin));
  app.use("/api/admin/usuarios", createAdminUserRouter(adminUserService, authenticate, requireAdmin));
  app.use((_request, response) => response.status(404).json({ code: "NOT_FOUND", message: "Recurso no encontrado." }));
  app.use(errorHandler);
  return app;
};
