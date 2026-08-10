import assert from "node:assert/strict";
import test from "node:test";
import { OrderService } from "../src/modules/orders/application/OrderService.js";

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
