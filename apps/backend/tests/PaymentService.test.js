import assert from "node:assert/strict";
import test from "node:test";
import { PaymentService } from "../src/modules/payments/application/PaymentService.js";

const user = { id: "user-1", email: "cliente@example.com", firstName: "Ana", lastName: "Pérez" };
const order = { id: "order-1", total: 42.5, payment: { status: "PENDING" } };

test("no permite procesar pagos sin credenciales", async () => {
  const service = new PaymentService({}, "", "");
  await assert.rejects(service.process(user, { orderId: order.id, paymentData: {} }, "key-1"), { code: "PAYMENT_PROVIDER_NOT_CONFIGURED" });
});

test("usa el total del servidor y confirma un pago aprobado", async () => {
  let providerBody;
  let providerUpdate;
  const repository = {
    findByIdAndUser: async () => order,
    updatePaymentFromProvider: async (_orderId, update) => { providerUpdate = update; return { ...order, payment: { status: update.status } }; },
  };
  const service = new PaymentService(repository, "TEST_TOKEN", "");
  service.paymentClient = { create: async ({ body }) => { providerBody = body; return { id: 987, status: "approved", payment_type_id: "credit_card", payment_method_id: "visa" }; } };

  const result = await service.process(user, {
    orderId: order.id,
    paymentData: { transaction_amount: 1, token: "card-token", payment_method_id: "visa", installments: 1 },
  }, "payment-key");

  assert.equal(providerBody.transaction_amount, 42.5);
  assert.equal(providerBody.payer.email, user.email);
  assert.deepEqual(providerUpdate, { id: "987", status: "APPROVED", method: "CREDIT_CARD" });
  assert.equal(result.payment.status, "APPROVED");
});
