import assert from "node:assert/strict";
import test from "node:test";
import { validateOperationalTransition } from "../src/modules/orders/infrastructure/PrismaOrderRepository.js";

test("permite iniciar la preparación de un pedido confirmado y pagado", () => {
  assert.equal(validateOperationalTransition({ status: "CONFIRMED", payment: { status: "APPROVED" } }, "PREPARING"), "CONFIRMED");
});

test("permite marcar como listo un pedido en preparación", () => {
  assert.equal(validateOperationalTransition({ status: "PREPARING", payment: { status: "APPROVED" } }, "READY"), "PREPARING");
});

test("impide preparar un pedido sin pago aprobado", () => {
  assert.throws(() => validateOperationalTransition({ status: "CONFIRMED", payment: { status: "PENDING" } }, "PREPARING"), { code: "PAYMENT_NOT_APPROVED" });
});

test("impide saltar estados operativos", () => {
  assert.throws(() => validateOperationalTransition({ status: "CONFIRMED", payment: { status: "APPROVED" } }, "READY"), { code: "INVALID_ORDER_STATUS_TRANSITION" });
});

test("permite enviar un pedido listo y posteriormente entregarlo", () => {
  assert.equal(validateOperationalTransition({ status: "READY", payment: { status: "APPROVED" } }, "OUT_FOR_DELIVERY"), "READY");
  assert.equal(validateOperationalTransition({ status: "OUT_FOR_DELIVERY", payment: { status: "APPROVED" } }, "DELIVERED"), "OUT_FOR_DELIVERY");
});
