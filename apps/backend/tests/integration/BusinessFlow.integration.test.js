import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { Prisma } from "@prisma/client";
import { PaymentService } from "../../src/modules/payments/application/PaymentService.js";
import { PrismaOrderRepository } from "../../src/modules/orders/infrastructure/PrismaOrderRepository.js";
import { issueSession, passwordHasher, prisma, request, resetDatabase, seedFixture, startIntegrationServer, stopIntegrationServer } from "./integrationContext.js";

let fixture; let cookies; let orders;
before(startIntegrationServer);
beforeEach(async () => {
  await resetDatabase();
  fixture = await seedFixture();
  cookies = {
    super: await issueSession(fixture.superAdmin.id), admin: await issueSession(fixture.admin.id),
    customer: await issueSession(fixture.customer.id),
  };
  orders = new PrismaOrderRepository(prisma);
});
after(stopIntegrationServer);

const auth = (cookie) => ({ Cookie: cookie });
let sequence = 0;
const createOrder = (overrides = {}, cookie = cookies.customer) => request("/api/pedidos", {
  method: "POST",
  headers: { ...auth(cookie), "Idempotency-Key": `it-order-${Date.now()}-${sequence += 1}` },
  body: { items: [{ productId: fixture.product.id, quantity: 2 }], paymentMethod: "CREDIT_CARD", addressId: fixture.address.id, ...overrides },
});
const approve = (id, externalId = `mp-${Date.now()}-${sequence += 1}`, method = "CREDIT_CARD") => orders.updatePaymentFromProvider(id, { id: externalId, status: "APPROVED", method });

test("IT-USR-01: ADMIN lista, edita y desactiva clientes revocando sesiones y auditando", async () => {
  const listed = await request("/api/admin/usuarios?role=CUSTOMER&search=cliente", { headers: auth(cookies.admin) });
  assert.equal(listed.status, 200); assert.equal(listed.body.data.length, 1); assert.equal("passwordHash" in listed.body.data[0], false);
  const updated = await request(`/api/admin/usuarios/${fixture.customer.id}`, { method: "PUT", headers: auth(cookies.admin), body: { firstName: "Cliente", lastName: "Actualizado", phone: "999888777" } });
  assert.equal(updated.status, 200); assert.equal(updated.body.lastName, "Actualizado");
  const disabled = await request(`/api/admin/usuarios/${fixture.customer.id}/status`, { method: "PATCH", headers: auth(cookies.admin), body: { active: false } });
  assert.equal(disabled.status, 200); assert.equal(disabled.body.active, false);
  assert.equal((await request("/api/auth/me", { headers: auth(cookies.customer) })).status, 401);
  assert.equal(await prisma.auditLog.count({ where: { entityId: fixture.customer.id } }), 2);
});

test("IT-USR-02: SUPER_ADMIN crea y administra una cuenta administrativa", async () => {
  const created = await request("/api/admin/usuarios/administradores", { method: "POST", headers: auth(cookies.super), body: { email: "nuevo.admin@test.local", password: "Clave-segura-456", firstName: "Nuevo", lastName: "Admin" } });
  assert.equal(created.status, 201); assert.equal(created.body.role, "ADMIN"); assert.equal("passwordHash" in created.body, false);
  const changed = await request(`/api/admin/usuarios/${created.body.id}`, { method: "PUT", headers: auth(cookies.super), body: { firstName: "Administrador", lastName: "Dos", phone: "900000001" } });
  assert.equal(changed.status, 200);
  assert.equal((await request(`/api/admin/usuarios/${created.body.id}`, { method: "DELETE", headers: auth(cookies.super) })).status, 200);
  assert.equal((await prisma.user.findUnique({ where: { id: created.body.id } })).active, false);
});

test("IT-USR-03: ADMIN no gestiona administradores ni se desactiva a sí mismo", async () => {
  assert.equal((await request(`/api/admin/usuarios/${fixture.admin.id}`, { method: "PUT", headers: auth(cookies.admin), body: { firstName: "No", lastName: "Permitido" } })).status, 403);
  assert.equal((await request(`/api/admin/usuarios/${fixture.admin.id}/status`, { method: "PATCH", headers: auth(cookies.admin), body: { active: false } })).status, 409);
  assert.equal((await request("/api/admin/usuarios/administradores", { method: "POST", headers: auth(cookies.admin), body: { email: "prohibido@test.local", password: "Clave-segura-456", firstName: "No", lastName: "Permitido" } })).status, 403);
});

test("IT-ORD-01: crear pedido persiste cabecera, detalle, pago, movimiento, auditoría y descuenta stock atómicamente", async () => {
  const result = await createOrder(); assert.equal(result.status, 201); assert.equal(result.body.total, 20); assert.equal(result.body.payment.status, "PENDING");
  assert.equal((await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock, 18);
  assert.equal(await prisma.orderItem.count({ where: { orderId: result.body.id } }), 1);
  assert.equal(await prisma.inventoryMovement.count({ where: { reference: result.body.id, type: "SALE" } }), 1);
  assert.equal(await prisma.auditLog.count({ where: { entityId: result.body.id, action: "ORDER_CREATED" } }), 1);
});

test("IT-ORD-02: repetir Idempotency-Key devuelve el mismo pedido sin duplicar efectos", async () => {
  const key = `same-${Date.now()}`; const options = { method: "POST", headers: { ...auth(cookies.customer), "Idempotency-Key": key }, body: { items: [{ productId: fixture.product.id, quantity: 1 }], paymentMethod: "CREDIT_CARD", addressId: fixture.address.id } };
  const first = await request("/api/pedidos", options); const second = await request("/api/pedidos", options);
  assert.equal(first.status, 201); assert.equal(second.status, 201); assert.equal(second.body.id, first.body.id);
  assert.equal(await prisma.order.count(), 1); assert.equal((await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock, 19);
});

test("IT-ORD-03: dos compras concurrentes por la última unidad solo permiten una", async () => {
  await prisma.product.update({ where: { id: fixture.product.id }, data: { stock: 1 } });
  const results = await Promise.all([createOrder({ items: [{ productId: fixture.product.id, quantity: 1 }] }), createOrder({ items: [{ productId: fixture.product.id, quantity: 1 }] })]);
  assert.deepEqual(results.map((item) => item.status).sort(), [201, 409]); assert.equal(await prisma.order.count(), 1); assert.equal((await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock, 0);
});

test("IT-ORD-04: producto inexistente o no disponible revierte toda la operación", async () => {
  await prisma.product.update({ where: { id: fixture.product.id }, data: { active: false } });
  const result = await createOrder(); assert.equal(result.status, 409); assert.equal(await prisma.order.count(), 0);
  assert.equal((await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock, 20);
});

test("IT-ORD-05: comprar combo distribuye precio y descuenta cantidades de sus componentes", async () => {
  const second = await prisma.product.create({ data: { name: "Segundo componente", description: "Combo", price: 5, stock: 10, active: true, categoryId: fixture.category.id } });
  const combo = await prisma.promotion.create({ data: { name: "Combo integración", kind: "BUNDLE", bundlePrice: 18, startsAt: new Date(Date.now() - 1000), endsAt: new Date(Date.now() + 3600000), active: true, createdById: fixture.admin.id, products: { create: [{ productId: fixture.product.id, quantity: 2 }, { productId: second.id, quantity: 1 }] } } });
  const result = await createOrder({ items: [{ promotionId: combo.id, quantity: 2 }] });
  assert.equal(result.status, 201); assert.equal(result.body.total, 36); assert.equal(result.body.items.length, 2);
  assert.equal((await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock, 16); assert.equal((await prisma.product.findUnique({ where: { id: second.id } })).stock, 8);
});

test("IT-ORD-06: cliente no puede entregar a una dirección perteneciente a otro usuario", async () => {
  const other = await prisma.user.create({ data: { email: "otro@test.local", passwordHash: "hash", firstName: "Otro", lastName: "Cliente", addresses: { create: { addressLine: "Otra dirección", latitude: -12, longitude: -77 } } } });
  const address = await prisma.address.findFirstOrThrow({ where: { userId: other.id } });
  assert.equal((await createOrder({ addressId: address.id })).status, 400); assert.equal(await prisma.order.count(), 0);
});

test("IT-ORD-07: el servidor ignora totales del cliente y calcula precios desde MySQL", async () => {
  const result = await createOrder({ items: [{ productId: fixture.product.id, quantity: 1 }], total: 0.01, subtotal: 0.01 });
  assert.equal(result.status, 201); assert.equal(result.body.total, 10); assert.equal(result.body.items[0].unitPrice, 10);
});

test("IT-ORD-08: historial y detalle están aislados por propietario", async () => {
  const order = await createOrder(); const intruder = await prisma.user.create({ data: { email: "intruso@test.local", passwordHash: "hash", firstName: "I", lastName: "N" } }); const intruderCookie = await issueSession(intruder.id);
  assert.equal((await request("/api/pedidos/historial?page=1&limit=10", { headers: auth(cookies.customer) })).body.pagination.total, 1);
  assert.equal((await request(`/api/pedidos/${order.body.id}`, { headers: auth(intruderCookie) })).status, 404);
});

test("IT-ORD-09: pedidos actuales e historial mensual separan activos y entregados", async () => {
  const delivered = await createOrder(); await approve(delivered.body.id); await prisma.order.update({ where: { id: delivered.body.id }, data: { status: "DELIVERED" } });
  const activeOrder = await createOrder({ items: [{ productId: fixture.product.id, quantity: 1 }] });
  const active = await request("/api/pedidos/actuales", { headers: auth(cookies.customer) }); const months = await request("/api/pedidos/historial-mensual", { headers: auth(cookies.customer) });
  assert.deepEqual(active.body.map((item) => item.id), [activeOrder.body.id]); assert.equal(months.body[0].orders[0].id, delivered.body.id);
});

test("IT-ORD-10: panel administrativo pagina, filtra, busca y entrega resumen", async () => {
  const order = await createOrder(); await approve(order.body.id);
  const result = await request(`/api/pedidos/admin?page=1&limit=1&status=CONFIRMED&search=${fixture.customer.email}`, { headers: auth(cookies.admin) });
  assert.equal(result.status, 200); assert.equal(result.body.data.length, 1); assert.equal(result.body.pagination.total, 1); assert.equal(result.body.summary.confirmed, 1);
});

test("IT-ORD-11: flujo operativo exige pago y respeta CONFIRMED→PREPARING→READY→OUT_FOR_DELIVERY→DELIVERED", async () => {
  const order = await createOrder(); const endpoint = (status) => request(`/api/pedidos/admin/${order.body.id}/status`, { method: "PATCH", headers: auth(cookies.admin), body: { status } });
  assert.equal((await endpoint("PREPARING")).status, 409); await approve(order.body.id);
  for (const status of ["PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"]) assert.equal((await endpoint(status)).body.status, status);
  assert.equal(await prisma.auditLog.count({ where: { entityId: order.body.id, action: "ORDER_STATUS_UPDATED" } }), 4);
});

test("IT-ORD-12: estadísticas mensuales incluyen ventas, ticket y productos pagados", async () => {
  const order = await createOrder(); await approve(order.body.id); const month = new Date().toISOString().slice(0, 7);
  const result = await request(`/api/pedidos/admin-estadisticas?month=${month}`, { headers: auth(cookies.admin) });
  assert.equal(result.status, 200); assert.equal(result.body.summary.orders, 1); assert.equal(result.body.summary.revenue, 20); assert.equal(result.body.topProducts[0].units, 2);
});

test("IT-PAY-01: aprobación persiste proveedor, confirma pedido y registra auditoría", async () => {
  const order = await createOrder(); const updated = await approve(order.body.id, "mp-approved");
  assert.equal(updated.status, "CONFIRMED"); assert.equal(updated.payment.externalId, "mp-approved"); assert.ok(updated.payment.paidAt);
  assert.equal(await prisma.auditLog.count({ where: { entityId: order.body.id, action: "PAYMENT_APPROVED" } }), 1);
});

test("IT-PAY-02: rechazo cancela, devuelve stock y solo genera una devolución", async () => {
  const order = await createOrder(); const rejected = { id: "mp-rejected", status: "REJECTED", method: "DEBIT_CARD" };
  await orders.updatePaymentFromProvider(order.body.id, rejected); await orders.updatePaymentFromProvider(order.body.id, rejected);
  assert.equal((await prisma.order.findUnique({ where: { id: order.body.id } })).status, "CANCELLED"); assert.equal((await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock, 20);
  assert.equal(await prisma.inventoryMovement.count({ where: { reference: order.body.id, type: "RETURN" } }), 1);
});

test("IT-PAY-03: mapeo de métodos reconoce Yape, débito, prepago y crédito", () => {
  const service = new PaymentService(orders, "token", "");
  assert.equal(service.mapMethod({ payment_method_id: "yape" }), "YAPE"); assert.equal(service.mapMethod({ payment_type_id: "debit_card" }), "DEBIT_CARD");
  assert.equal(service.mapMethod({ payment_type_id: "prepaid_card" }), "PREPAID_CARD"); assert.equal(service.mapMethod({ payment_type_id: "credit_card" }), "CREDIT_CARD");
});

test("IT-PAY-04: sincronización de webhook consulta al proveedor y actualiza el pedido", async () => {
  const order = await createOrder(); const service = new PaymentService(orders, "token", "");
  service.paymentClient = { get: async ({ id }) => ({ id, external_reference: order.body.id, status: "approved", payment_type_id: "credit_card" }) };
  const result = await service.synchronize("mp-webhook"); assert.equal(result.status, "CONFIRMED"); assert.equal(result.payment.externalId, "mp-webhook");
});

test("IT-PAY-05: notificaciones repetidas o fuera de orden no duplican efectos ni degradan un pago aprobado", async () => {
  const order = await createOrder(); await approve(order.body.id, "mp-final");
  await orders.updatePaymentFromProvider(order.body.id, { id: "mp-old", status: "REJECTED", method: "CREDIT_CARD" });
  const stored = await prisma.order.findUnique({ where: { id: order.body.id }, include: { payment: true } });
  assert.equal(stored.status, "CONFIRMED"); assert.equal(stored.payment.status, "APPROVED"); assert.equal((await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock, 18);
});

test("IT-PAY-06: webhook sin identificador responde 200 y no modifica pagos", async () => {
  const order = await createOrder(); const before = await prisma.payment.findUnique({ where: { orderId: order.body.id } });
  const result = await request("/api/pagos/webhook", { method: "POST", body: { type: "payment" } }); const afterPayment = await prisma.payment.findUnique({ where: { orderId: order.body.id } });
  assert.equal(result.status, 200); assert.equal(afterPayment.status, before.status); assert.equal(afterPayment.externalId, null);
});

test("IT-DB-01: las ocho migraciones de Prisma están aplicadas en la base de prueba", async () => {
  const rows = await prisma.$queryRaw`SELECT COUNT(*) AS total FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  assert.equal(Number(rows[0].total), 8);
});

test("IT-DB-02: MySQL aplica restricciones UNIQUE y claves foráneas", async () => {
  await assert.rejects(() => prisma.user.create({ data: { email: fixture.customer.email, passwordHash: "hash", firstName: "Duplicado", lastName: "Usuario" } }), (error) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002");
  await assert.rejects(() => prisma.product.create({ data: { name: "Sin categoría", description: "Inválido", price: 5, stock: 1, categoryId: 999999 } }), (error) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003");
});

test("IT-DB-03: bootstrap lógico del superadministrador es idempotente", async () => {
  const email = "bootstrap@test.local"; const passwordHash = await passwordHasher.hash("Clave-segura-789");
  const bootstrap = () => prisma.user.upsert({ where: { email }, update: { role: "SUPER_ADMIN", active: true, deletedAt: null }, create: { email, passwordHash, firstName: "Admin", lastName: "Principal", role: "SUPER_ADMIN" } });
  const first = await bootstrap(); const second = await bootstrap(); assert.equal(first.id, second.id); assert.equal(await prisma.user.count({ where: { email } }), 1); assert.equal(second.role, "SUPER_ADMIN");
});
