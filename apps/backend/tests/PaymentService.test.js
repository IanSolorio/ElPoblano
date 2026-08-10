import assert from "node:assert/strict";
import test from "node:test";
import { PaymentService } from "../src/modules/payments/application/PaymentService.js";
import { PrismaOrderRepository } from "../src/modules/orders/infrastructure/PrismaOrderRepository.js";

const user = { id: "user-1", email: "cliente@example.com", firstName: "Ana", lastName: "Pérez" };
const order = (overrides = {}) => ({ id: "order-12345678", userId: "user-1", status: "PENDING", total: 20, items: [], payment: { status: "PENDING" }, ...overrides });
const paymentData = { token: "card-token", installments: 1, payment_method_id: "visa", payer: { email: "payer@example.com" } };

class FakeOrderRepository {
  constructor(value = order()) { this.value = value; this.updates = []; }
  findByIdAndUser(id, userId) { return this.value?.id === id && this.value?.userId === userId ? this.value : null; }
  updatePaymentFromProvider(id, data) { this.updates.push({ id, data }); return { ...this.value, status: data.status === "APPROVED" ? "CONFIRMED" : this.value.status, payment: data }; }
}

const configuredService = (repository, provider = { id: 123, status: "approved", payment_method_id: "visa", payment_type_id: "credit_card" }) => {
  const service = new PaymentService(repository, undefined, "https://example.com/webhook"); service.paymentClient = { create: async () => provider, get: async () => provider }; return service;
};

test("UT-PAY-01: rechaza procesamiento sin credenciales", () => { assert.throws(() => new PaymentService(new FakeOrderRepository()).ensureConfigured(), { code: "PAYMENT_PROVIDER_NOT_CONFIGURED" }); });

test("UT-PAY-02: exige clave idempotente para procesar", async () => { await assert.rejects(configuredService(new FakeOrderRepository()).process(user, { orderId: order().id, paymentData }), { code: "IDEMPOTENCY_KEY_REQUIRED" }); });

test("UT-PAY-03: no permite pagar pedido ajeno o inexistente", async () => { await assert.rejects(configuredService(new FakeOrderRepository(null)).process(user, { orderId: "missing", paymentData }, "key"), { code: "ORDER_NOT_FOUND" }); });

test("UT-PAY-04: pedido ya aprobado se devuelve sin cobrar otra vez", async () => {
  const repository = new FakeOrderRepository(order({ status: "CONFIRMED", payment: { status: "APPROVED" } })); let calls = 0; const service = configuredService(repository); service.paymentClient.create = async () => { calls += 1; };
  const result = await service.process(user, { orderId: repository.value.id, paymentData }, "key"); assert.equal(result.payment.status, "APPROVED"); assert.equal(calls, 0);
});

test("UT-PAY-05: pedido cancelado no puede pagarse", async () => { await assert.rejects(configuredService(new FakeOrderRepository(order({ status: "CANCELLED" }))).process(user, { orderId: order().id, paymentData }, "key"), { code: "ORDER_CANCELLED" }); });

test("UT-PAY-06: rechaza montos menores a S/ 3 o no finitos", async () => {
  for (const total of [2.99, Number.NaN]) await assert.rejects(configuredService(new FakeOrderRepository(order({ total }))).process(user, { orderId: order().id, paymentData }, "key"), { code: "INVALID_PAYMENT_AMOUNT" });
});

test("UT-PAY-07: solicitud usa total del servidor, usuario y referencia", async () => {
  const repository = new FakeOrderRepository(order({ total: 25.678 })); const service = configuredService(repository); let request;
  service.paymentClient.create = async (input) => { request = input; return { id: 123, status: "approved", payment_type_id: "credit_card", payment_method_id: "visa" }; };
  await service.process(user, { orderId: repository.value.id, paymentData: { ...paymentData, transaction_amount: 1 } }, "idem");
  assert.equal(request.body.transaction_amount, 25.68); assert.equal(request.body.external_reference, repository.value.id); assert.equal(request.body.payer.first_name, "Ana"); assert.equal(request.requestOptions.idempotencyKey, "idem");
});

test("UT-PAY-08: aprobación actualiza pago y confirma el pedido", async () => {
  const repository = new FakeOrderRepository(); const result = await configuredService(repository).process(user, { orderId: repository.value.id, paymentData }, "key"); assert.equal(repository.updates[0].data.status, "APPROVED"); assert.equal(result.status, "CONFIRMED");
});

test("UT-PAY-09: rechazo cancela y restituye inventario exactamente una vez", async () => {
  let status = "PENDING"; let returns = 0; const existing = order({ items: [{ productId: "p1", quantity: 2, unitPrice: 10, subtotal: 20 }], subtotal: 20, deliveryFee: 0 });
  const tx = { order: { findUnique: async () => ({ ...existing, status }), update: async ({ data }) => { status = data.status; }, }, payment: { update: async () => {} }, product: { update: async () => { returns += 1; } }, inventoryMovement: { createMany: async () => {} }, auditLog: { create: async () => {} } };
  const repository = new PrismaOrderRepository({ $transaction: async (callback) => callback(tx) }); await repository.updatePaymentFromProvider(existing.id, { id: "mp-1", status: "REJECTED", method: "CREDIT_CARD" }); await repository.updatePaymentFromProvider(existing.id, { id: "mp-1", status: "REJECTED", method: "CREDIT_CARD" });
  assert.equal(status, "CANCELLED"); assert.equal(returns, 1);
});

test("UT-PAY-10: error del proveedor se traduce sin exponer detalles internos", async () => {
  const service = configuredService(new FakeOrderRepository()); service.paymentClient.create = async () => { throw new Error("provider unavailable"); };
  await assert.rejects(service.process(user, { orderId: order().id, paymentData }, "key"), { code: "PAYMENT_PROCESSING_FAILED", status: 422 });
});

test("UT-PAY-11: mapea Yape, débito, prepago y crédito", () => {
  const service = new PaymentService({}); assert.equal(service.mapMethod({ payment_method_id: "yape" }), "YAPE"); assert.equal(service.mapMethod({ payment_type_id: "debit_card" }), "DEBIT_CARD"); assert.equal(service.mapMethod({ payment_type_id: "prepaid_card" }), "PREPAID_CARD"); assert.equal(service.mapMethod({ payment_type_id: "credit_card" }), "CREDIT_CARD");
});

test("UT-PAY-12: webhook sin referencia externa no altera pedidos", async () => {
  const repository = new FakeOrderRepository(); const service = configuredService(repository, { id: 1, status: "approved" }); const result = await service.synchronize(1); assert.equal(result, null); assert.equal(repository.updates.length, 0);
});

test("UT-PAY-13: webhook repetido conserva actualización idempotente", async () => {
  const repository = new FakeOrderRepository(); const provider = { id: 1, status: "approved", external_reference: repository.value.id, payment_type_id: "credit_card" }; const service = configuredService(repository, provider);
  await service.synchronize(1); await service.synchronize(1); assert.equal(repository.updates.every((update) => update.id === repository.value.id && update.data.id === "1"), true);
});
