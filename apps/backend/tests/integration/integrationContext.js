import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = resolve(fileURLToPath(new URL("../../", import.meta.url)));
config({ path: resolve(backendRoot, ".env"), quiet: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL no está configurada.");
const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (!databaseName.endsWith("_test")) throw new Error("Integración rechazada: la base debe terminar en _test.");
process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = "test";
process.env.FRONTEND_ORIGIN = "http://integration.test";

const [{ createApp }, { prisma }, { passwordHasher }] = await Promise.all([
  import("../../src/app.js"),
  import("../../src/shared/database/prisma.js"),
  import("../../src/modules/auth/infrastructure/passwordHasher.js"),
]);
const { createSessionToken, hashSessionToken } = await import("../../src/shared/security/sessionToken.js");

let server;
let baseUrl;

export const startIntegrationServer = async () => {
  if (server) return;
  await new Promise((resolveStart) => {
    server = createApp().listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolveStart();
    });
  });
};

export const stopIntegrationServer = async () => {
  if (server) await new Promise((resolveClose) => server.close(resolveClose));
  server = undefined;
  await prisma.$disconnect();
};

export const resetDatabase = async () => {
  await prisma.auditLog.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promotionProduct.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
};

export const seedFixture = async () => {
  const password = "Clave-segura-123";
  const passwordHash = await passwordHasher.hash(password);
  // Ejecutar estas escrituras en serie evita deadlocks esporádicos de MySQL
  // durante la preparación repetida de la base aislada.
  const superAdmin = await prisma.user.create({ data: { email: "super@test.local", passwordHash, firstName: "Super", lastName: "Admin", role: "SUPER_ADMIN" } });
  const admin = await prisma.user.create({ data: { email: "admin@test.local", passwordHash, firstName: "Ana", lastName: "Admin", role: "ADMIN" } });
  const customer = await prisma.user.create({ data: { email: "cliente@test.local", passwordHash, firstName: "Carlos", lastName: "Cliente", role: "CUSTOMER", phone: "999111222", addresses: { create: { label: "Casa", addressLine: "Av. Pruebas 123", latitude: -12.0464, longitude: -77.0428, isDefault: true } } } });
  const inactiveCustomer = await prisma.user.create({ data: { email: "inactivo@test.local", passwordHash, firstName: "Inés", lastName: "Inactiva", role: "CUSTOMER", active: false } });
  /*
    prisma.user.create({ data: { email: "super@test.local", passwordHash, firstName: "Super", lastName: "Admin", role: "SUPER_ADMIN" } }),
    prisma.user.create({ data: { email: "admin@test.local", passwordHash, firstName: "Ana", lastName: "Admin", role: "ADMIN" } }),
    prisma.user.create({ data: { email: "cliente@test.local", passwordHash, firstName: "Carlos", lastName: "Cliente", role: "CUSTOMER", phone: "999111222", addresses: { create: { label: "Casa", addressLine: "Av. Pruebas 123", latitude: -12.0464, longitude: -77.0428, isDefault: true } } } }),
    prisma.user.create({ data: { email: "inactivo@test.local", passwordHash, firstName: "Inés", lastName: "Inactiva", role: "CUSTOMER", active: false } }),
  ]); */
  const category = await prisma.category.create({ data: { name: "Tacos", slug: "tacos-test", active: true } });
  const inactiveCategory = await prisma.category.create({ data: { name: "Oculta", slug: "oculta-test", active: false } });
  const product = await prisma.product.create({ data: { name: "Taco de prueba", description: "Producto de integración", price: 10, stock: 20, active: true, categoryId: category.id } });
  const zeroStockProduct = await prisma.product.create({ data: { name: "Taco agotado", description: "Sin stock", price: 8, stock: 0, active: true, categoryId: category.id } });
  const address = await prisma.address.findFirstOrThrow({ where: { userId: customer.id } });
  return { password, superAdmin, admin, customer, inactiveCustomer, category, inactiveCategory, product, zeroStockProduct, address };
};

export const request = async (path, options = {}) => {
  const headers = { Origin: "http://integration.test", ...(options.headers || {}) };
  if (options.body !== undefined && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers, body: options.body === undefined || options.body instanceof FormData ? options.body : JSON.stringify(options.body) });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, status: response.status, body, cookie: response.headers.get("set-cookie")?.split(";")[0] };
};

export const login = async (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } });
export const issueSession = async (userId) => {
  const token = createSessionToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return `elpoblano_session=${token}`;
};
export { prisma, passwordHasher, databaseName };
