import assert from "node:assert/strict";
import test from "node:test";
import { OrderService } from "../src/modules/orders/application/OrderService.js";
import { PrismaOrderRepository } from "../src/modules/orders/infrastructure/PrismaOrderRepository.js";

const order = (overrides = {}) => ({ id: "order-1", userId: "user-1", status: "CONFIRMED", total: 20, ...overrides });

test("UT-ORD-01: crear pedido exige Idempotency-Key", () => {
  assert.throws(() => new OrderService({}).create({ id: "user-1" }, { items: [] }), { code: "IDEMPOTENCY_KEY_REQUIRED" });
});

test("UT-ORD-02: consultar pedido propio devuelve su detalle", async () => {
  const repository = { findByIdAndUser: async (id, userId) => id === "order-1" && userId === "user-1" ? order() : null };
  assert.equal((await new OrderService(repository).getById("user-1", "order-1")).id, "order-1");
});

test("UT-ORD-03: pedido ajeno e inexistente producen el mismo ORDER_NOT_FOUND", async () => {
  const service = new OrderService({ findByIdAndUser: async () => null }); await assert.rejects(service.getById("user-1", "ajeno"), { code: "ORDER_NOT_FOUND", status: 404 });
});

test("UT-ORD-04: pedidos actuales delega el usuario y excluye estados terminales", async () => {
  let received; const repository = { findActiveByUser: async (userId) => { received = userId; return [order({ status: "PENDING" }), order({ id: "o2", status: "READY" })]; } };
  const result = await new OrderService(repository).active("user-1"); assert.equal(received, "user-1"); assert.equal(result.every((item) => !["DELIVERED", "CANCELLED"].includes(item.status)), true);
});

test("UT-ORD-05: historial mensual contiene solo entregados agrupados por mes", async () => {
  const repository = { findMonthlyHistoryByUser: async () => [{ month: "2026-08", orderCount: 2, orders: [order({ status: "DELIVERED" }), order({ id: "o2", status: "DELIVERED" })] }] };
  const result = await new OrderService(repository).monthlyHistory("user-1"); assert.equal(result[0].month, "2026-08"); assert.equal(result[0].orders.every((item) => item.status === "DELIVERED"), true);
});

test("UT-ORD-17: cancelar delega solamente el pedido del usuario autenticado", async () => {
  let received;
  const service = new OrderService({ cancelPendingByUser: async (orderId, userId) => {
    received = { orderId, userId };
    return order({ status: "CANCELLED" });
  } });
  const result = await service.cancel("user-1", "order-1");
  assert.deepEqual(received, { orderId: "order-1", userId: "user-1" });
  assert.equal(result.status, "CANCELLED");
});

test("UT-ORD-18: cancelar un pedido pendiente restituye stock exactamente una vez", async () => {
  let status = "PENDING";
  let returned = 0;
  const existing = order({ status, items: [{ id: 1, productId: "p1", productName: "Taco", quantity: 2, unitPrice: 10, subtotal: 20 }], subtotal: 20, deliveryFee: 0, payment: { status: "PENDING", externalId: null, amount: 20 } });
  const current = () => ({ ...existing, status });
  const transaction = {
    order: { findFirst: async () => current(), findUnique: async () => current(), updateMany: async () => status === "PENDING" ? (status = "CANCELLED", { count: 1 }) : ({ count: 0 }) },
    product: { update: async () => { returned += 1; } },
    inventoryMovement: { createMany: async () => {} },
    auditLog: { create: async () => {} },
  };
  const repository = new PrismaOrderRepository({ $transaction: async (callback) => callback(transaction) });
  assert.equal((await repository.cancelPendingByUser("order-1", "user-1")).status, "CANCELLED");
  assert.equal(returned, 1);
  await assert.rejects(repository.cancelPendingByUser("order-1", "user-1"), { code: "ORDER_CANNOT_BE_CANCELLED" });
  assert.equal(returned, 1);
});

test("UT-ORD-19: repositorio pagina y serializa consultas de cliente y administrador", async () => {
  const stored = {
    id: "order-1", userId: "user-1", status: "DELIVERED", createdAt: new Date("2026-08-10T12:00:00Z"),
    subtotal: "20", deliveryFee: "0", total: "20",
    items: [{ id: 1, productId: "p1", productName: "Taco", quantity: 2, unitPrice: "10", subtotal: "20" }],
    payment: { status: "APPROVED", amount: "20" },
  };
  const orderModel = {
    findMany: async () => [stored],
    count: async () => 1,
    findFirst: async ({ where }) => where.id === "missing" ? null : stored,
    findUnique: async ({ where }) => where.id === "missing" ? null : stored,
    groupBy: async () => [{ status: "DELIVERED", _count: { _all: 1 } }],
  };
  const prisma = {
    order: orderModel,
    $transaction: async (operations) => Promise.all(operations),
  };
  const repository = new PrismaOrderRepository(prisma);
  const own = await repository.findByUser("user-1", { page: 1, limit: 10 });
  assert.equal(own.data[0].total, 20);
  assert.deepEqual(own.pagination, { page: 1, limit: 10, total: 1, pages: 1 });
  assert.equal((await repository.findByIdAndUser("order-1", "user-1")).payment.amount, 20);
  assert.equal(await repository.findByIdAndUser("missing", "user-1"), null);
  assert.equal((await repository.findActiveByUser("user-1"))[0].items[0].unitPrice, 10);
  const history = await repository.findMonthlyHistoryByUser("user-1");
  assert.deepEqual({ month: history[0].month, count: history[0].orderCount, spent: history[0].totalSpent }, { month: "2026-08", count: 1, spent: 20 });
  const admin = await repository.findAllForAdmin({ page: 1, limit: 12, status: "DELIVERED", search: "cliente" });
  assert.equal(admin.summary.delivered, 1);
  assert.equal(admin.summary.pending, 0);
  assert.equal(admin.data[0].subtotal, 20);
  assert.equal((await repository.findByIdForAdmin("order-1")).id, "order-1");
  assert.equal(await repository.findByIdForAdmin("missing"), null);
});
