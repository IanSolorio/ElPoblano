import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import argon2 from "argon2";

const root = process.cwd();
config({ path: resolve(root, "apps/backend/.env"), quiet: true });
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL no está configurada.");
const databaseName = new URL(databaseUrl).pathname.slice(1);
if (!databaseName.endsWith("_test")) throw new Error(`Selenium exige una base terminada en _test (actual: ${databaseName}).`);
process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = "test";
const { prisma } = await import("../apps/backend/src/shared/database/prisma.js");

const password = process.env.E2E_TEST_PASSWORD || "Clave-E2E-segura-2026!";
const hash = await argon2.hash(password, { type: argon2.argon2id });
const sessionToken = () => randomBytes(32).toString("base64url");
const tokenHash = (token) => createHash("sha256").update(token).digest("hex");

const createUser = (data) => prisma.user.create({ data: { passwordHash: hash, active: true, ...data } });
const orderWithStatus = async ({ user, product, status, suffix, paid = true }) => {
  const order = await prisma.order.create({
    data: {
      id: randomUUID(), userId: user.id, idempotencyKey: `e2e-order-${suffix}-${randomUUID()}`,
      status, customerName: `${user.firstName} ${user.lastName}`, customerEmail: user.email,
      customerPhone: user.phone || "999111222", deliveryAddress: "Av. Automatización 123",
      deliveryLatitude: -12.0464, deliveryLongitude: -77.0428, notes: `Fixture ${suffix}`,
      subtotal: 10, deliveryFee: 0, total: 10,
      items: { create: { productId: product.id, productName: product.name, unitPrice: 10, quantity: 1, subtotal: 10 } },
      payment: { create: { provider: paid ? "E2E_STUB" : "CARD_PENDING_INTEGRATION", method: "CREDIT_CARD", status: paid ? "APPROVED" : "PENDING", amount: 10, paidAt: paid ? new Date() : null } },
    }, include: { payment: true },
  });
  return order;
};

try {
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

  const superAdmin = await createUser({ email: "e2e.superadmin@test.local", firstName: "Sofía", lastName: "Principal", role: "SUPER_ADMIN", phone: "999000001" });
  const admin = await createUser({ email: "e2e.admin@test.local", firstName: "Adriana", lastName: "Operadora", role: "ADMIN", phone: "999000002" });
  const customer = await createUser({ email: "e2e.customer@test.local", firstName: "Carlos", lastName: "Cliente", role: "CUSTOMER", phone: "999000003" });
  const inactiveCustomer = await createUser({ email: "e2e.inactive@test.local", firstName: "Irene", lastName: "Inactiva", role: "CUSTOMER", phone: "999000004", active: false });
  const editableAdmin = await createUser({ email: "e2e.editable.admin@test.local", firstName: "Elena", lastName: "Editable", role: "ADMIN", phone: "999000005" });
  const address = await prisma.address.create({ data: { userId: customer.id, label: "Casa E2E", addressLine: "Av. Automatización 123", reference: "Frente al parque", latitude: -12.0464, longitude: -77.0428, isDefault: true } });

  const category = await prisma.category.create({ data: { name: "Tacos E2E", slug: "tacos-e2e", active: true } });
  const hiddenCategory = await prisma.category.create({ data: { name: "Oculta E2E", slug: "oculta-e2e", active: false } });
  const product = await prisma.product.create({ data: { categoryId: category.id, name: "Taco Selenium", description: "Producto controlado para automatización", price: 10, stock: 500, active: true, imageUrl: "https://placehold.co/600x400?text=Taco+Selenium" } });
  const secondProduct = await prisma.product.create({ data: { categoryId: category.id, name: "Quesadilla Selenium", description: "Segundo producto para combos", price: 12, stock: 500, active: true, imageUrl: "https://placehold.co/600x400?text=Quesadilla" } });
  const zeroStockProduct = await prisma.product.create({ data: { categoryId: category.id, name: "Producto agotado E2E", description: "No debe mostrarse en catálogo", price: 8, stock: 0, active: true } });
  const retiredProduct = await prisma.product.create({ data: { categoryId: category.id, name: "Producto retirado E2E", description: "Retirado", price: 9, stock: 20, active: false, deletedAt: new Date() } });

  const activePromotion = await prisma.promotion.create({ data: { name: "Promo Selenium vigente", description: "Descuento E2E", kind: "PRODUCT_DISCOUNT", discountType: "PERCENTAGE", discountValue: 10, startsAt: new Date(Date.now() - 3600000), endsAt: new Date(Date.now() + 86400000), active: true, createdById: admin.id, products: { create: { productId: product.id, quantity: 1 } } } });
  const bundle = await prisma.promotion.create({ data: { name: "Combo Selenium", description: "Combo E2E", kind: "BUNDLE", bundlePrice: 18, imageUrl: "https://placehold.co/600x400?text=Combo+Selenium", startsAt: new Date(Date.now() - 3600000), endsAt: new Date(Date.now() + 86400000), active: true, createdById: admin.id, products: { create: [{ productId: product.id, quantity: 1 }, { productId: secondProduct.id, quantity: 1 }] } } });
  const expiredPromotion = await prisma.promotion.create({ data: { name: "Promo Selenium vencida", description: "No visible", kind: "PRODUCT_DISCOUNT", discountType: "PERCENTAGE", discountValue: 20, startsAt: new Date(Date.now() - 172800000), endsAt: new Date(Date.now() - 86400000), active: true, createdById: admin.id, products: { create: { productId: secondProduct.id, quantity: 1 } } } });
  const futurePromotion = await prisma.promotion.create({ data: { name: "Promo Selenium futura", description: "Todavía no visible", kind: "PRODUCT_DISCOUNT", discountType: "PERCENTAGE", discountValue: 15, startsAt: new Date(Date.now() + 86400000), endsAt: new Date(Date.now() + 172800000), active: true, createdById: admin.id, products: { create: { productId: secondProduct.id, quantity: 1 } } } });

  const pending = await orderWithStatus({ user: customer, product, status: "PENDING", suffix: "pending", paid: false });
  const confirmed = await orderWithStatus({ user: customer, product, status: "CONFIRMED", suffix: "confirmed" });
  const preparing = await orderWithStatus({ user: customer, product, status: "PREPARING", suffix: "preparing" });
  const ready = await orderWithStatus({ user: customer, product, status: "READY", suffix: "ready" });
  const delivery = await orderWithStatus({ user: customer, product, status: "OUT_FOR_DELIVERY", suffix: "delivery" });
  const delivered = await orderWithStatus({ user: customer, product, status: "DELIVERED", suffix: "delivered" });
  await prisma.orderItem.updateMany({ where: { orderId: delivered.id }, data: { promotionId: activePromotion.id, promotionName: activePromotion.name, unitPrice: 9, subtotal: 9 } });
  await prisma.order.update({ where: { id: delivered.id }, data: { subtotal: 9, total: 9 } });
  await prisma.payment.update({ where: { orderId: delivered.id }, data: { amount: 9 } });
  await prisma.auditLog.createMany({ data: [
    { userId: admin.id, action: "PRODUCT_CREATED", entity: "Product", entityId: product.id },
    { userId: admin.id, action: "ORDER_STATUS_UPDATED", entity: "Order", entityId: preparing.id, metadata: { previousStatus: "CONFIRMED", newStatus: "PREPARING" } },
  ] });

  const sessions = {};
  for (const user of [superAdmin, admin, customer]) {
    const token = sessionToken();
    await prisma.session.create({ data: { userId: user.id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 86400000) } });
    sessions[user.role] = token;
  }

  const publicUser = ({ id, email, firstName, lastName, role, active }) => ({ id, email, firstName, lastName, role, active });
  const publicRecord = ({ id }) => ({ id });
  const fixture = {
    databaseName, password,
    users: {
      superAdmin: publicUser(superAdmin), admin: publicUser(admin), customer: publicUser(customer),
      inactiveCustomer: publicUser(inactiveCustomer), editableAdmin: publicUser(editableAdmin),
    },
    sessions,
    address: publicRecord(address),
    categories: { category: publicRecord(category), hiddenCategory: publicRecord(hiddenCategory) },
    products: { product: publicRecord(product), secondProduct: publicRecord(secondProduct), zeroStockProduct: publicRecord(zeroStockProduct), retiredProduct: publicRecord(retiredProduct) },
    promotions: { activePromotion: publicRecord(activePromotion), bundle: publicRecord(bundle), expiredPromotion: publicRecord(expiredPromotion), futurePromotion: publicRecord(futurePromotion) },
    orders: { pending: publicRecord(pending), confirmed: publicRecord(confirmed), preparing: publicRecord(preparing), ready: publicRecord(ready), delivery: publicRecord(delivery), delivered: publicRecord(delivered) },
  };
  const dataDirectory = resolve(root, "tests/results/fase6/selenium/tests/data");
  mkdirSync(dataDirectory, { recursive: true });
  writeFileSync(resolve(dataDirectory, "fixtures.json"), `${JSON.stringify(fixture, (_key, value) => typeof value === "bigint" ? value.toString() : value, 2)}\n`, "utf8");
  console.log(`Fixtures Selenium preparadas en ${databaseName}.`);
} finally {
  await prisma.$disconnect();
}
