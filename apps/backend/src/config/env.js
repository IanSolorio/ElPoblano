import { config } from "dotenv";
import { fileURLToPath } from "node:url";

config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), quiet: true });

export const env = {
  port: Number(process.env.PORT) || 3000,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
  sessionDurationDays: Number(process.env.SESSION_DURATION_DAYS) || 7,
  globalRateLimit: Number(process.env.GLOBAL_RATE_LIMIT) || 120,
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  databaseUrl: process.env.DATABASE_URL,
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replaceAll(String.raw`\n`, "\n"),
  mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  mercadoPagoNotificationUrl: process.env.MERCADO_PAGO_NOTIFICATION_URL,
  paymentProviderMode: process.env.NODE_ENV === "test" ? process.env.PAYMENT_PROVIDER_MODE : undefined,
};
