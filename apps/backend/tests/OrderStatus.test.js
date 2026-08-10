import assert from "node:assert/strict";
import test from "node:test";
import { PrismaOrderRepository, validateOperationalTransition } from "../src/modules/orders/infrastructure/PrismaOrderRepository.js";

const paid = (status) => ({ status, payment: { status: "APPROVED" } });
const serializedOrder = (overrides = {}) => ({ id: "order-1", userId: "user-1", status: "CONFIRMED", subtotal: 20, deliveryFee: 0, total: 20, items: [], payment: { status: "APPROVED", amount: 20 }, ...overrides });

test("UT-ORD-06: pedido confirmado y pagado puede iniciar preparación", () => { assert.equal(validateOperationalTransition(paid("CONFIRMED"), "PREPARING"), "CONFIRMED"); });
test("UT-ORD-07: pedido en preparación puede marcarse listo", () => { assert.equal(validateOperationalTransition(paid("PREPARING"), "READY"), "PREPARING"); });
test("UT-ORD-08: no permite preparar sin pago aprobado", () => { assert.throws(() => validateOperationalTransition({ status: "CONFIRMED", payment: { status: "PENDING" } }, "PREPARING"), { code: "PAYMENT_NOT_APPROVED" }); });
test("UT-ORD-09: impide saltar estados operativos", () => { assert.throws(() => validateOperationalTransition(paid("CONFIRMED"), "READY"), { code: "INVALID_ORDER_STATUS_TRANSITION" }); });
test("UT-ORD-10: pedido listo puede pasar a reparto", () => { assert.equal(validateOperationalTransition(paid("READY"), "OUT_FOR_DELIVERY"), "READY"); });
test("UT-ORD-11: pedido en reparto puede marcarse entregado", () => { assert.equal(validateOperationalTransition(paid("OUT_FOR_DELIVERY"), "DELIVERED"), "OUT_FOR_DELIVERY"); });

test("UT-ORD-12: cambiar estado de pedido inexistente devuelve 404", async () => {
  const tx = { order: { findUnique: async () => null } }; const repository = new PrismaOrderRepository({ $transaction: async (callback) => callback(tx) }); await assert.rejects(repository.updateOperationalStatus("missing", "PREPARING", "admin"), { code: "ORDER_NOT_FOUND" });
});

test("UT-ORD-13: cambio correcto audita estado anterior, nuevo y actor", async () => {
  const audits = []; let status = "CONFIRMED"; const tx = { order: {
    findUnique: async () => serializedOrder({ status }), updateMany: async ({ where, data }) => { assert.equal(where.status, "CONFIRMED"); status = data.status; return { count: 1 }; },
  }, auditLog: { create: async ({ data }) => audits.push(data) } };
  const result = await new PrismaOrderRepository({ $transaction: async (callback) => callback(tx) }).updateOperationalStatus("order-1", "PREPARING", "admin-1");
  assert.equal(result.status, "PREPARING"); assert.equal(audits[0].userId, "admin-1"); assert.deepEqual(audits[0].metadata, { previousStatus: "CONFIRMED", newStatus: "PREPARING" });
});

const statisticsOrder = (overrides = {}) => ({ id: "o1", userId: "u1", status: "DELIVERED", total: 30, payment: { status: "APPROVED", paidAt: new Date("2026-08-10") }, items: [{ productId: "p1", productName: "Taco", quantity: 2, subtotal: 20, promotionId: null, promotionName: null, promotion: null }, { productId: "p2", productName: "Agua", quantity: 1, subtotal: 10, promotionId: null, promotionName: null, promotion: null }], ...overrides });

test("UT-ORD-14: estadísticas calculan resumen mensual correctamente", async () => {
  const orders = [statisticsOrder(), statisticsOrder({ id: "o2", userId: "u2", total: 10, items: [{ productId: "p1", productName: "Taco", quantity: 1, subtotal: 10, promotionId: null, promotionName: null, promotion: null }] })];
  const result = await new PrismaOrderRepository({ order: { findMany: async () => orders } }).getMonthlyStatistics("2026-08");
  assert.deepEqual(result.summary, { orders: 2, revenue: 40, averageTicket: 20, customers: 2, productsSold: 4 }); assert.equal(result.ordersByStatus.DELIVERED, 2);
});

test("UT-ORD-15: rankings usan pagos aprobados y ordenan productos y promociones", async () => {
  const bundle = { id: "promo-1", kind: "BUNDLE", products: [{ productId: "p1", quantity: 2 }, { productId: "p2", quantity: 1 }] };
  const orders = [statisticsOrder({ items: [{ productId: "p1", productName: "Taco", quantity: 4, subtotal: 20, promotionId: "promo-1", promotionName: "Combo", promotion: bundle }, { productId: "p2", productName: "Agua", quantity: 2, subtotal: 10, promotionId: "promo-1", promotionName: "Combo", promotion: bundle }] })];
  const result = await new PrismaOrderRepository({ order: { findMany: async () => orders } }).getMonthlyStatistics("2026-08"); assert.equal(result.topProducts[0].productId, "p1"); assert.equal(result.topPromotions[0].units, 2); assert.equal(result.topPromotions[0].name, "Combo");
});

test("UT-ORD-16: mes sin ventas devuelve ceros y rankings vacíos", async () => {
  const result = await new PrismaOrderRepository({ order: { findMany: async () => [] } }).getMonthlyStatistics("2026-08"); assert.deepEqual(result.summary, { orders: 0, revenue: 0, averageTicket: 0, customers: 0, productsSold: 0 }); assert.deepEqual(result.topProducts, []); assert.deepEqual(result.topPromotions, []);
});
