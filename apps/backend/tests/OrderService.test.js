import assert from "node:assert/strict";
import test from "node:test";
import { OrderService } from "../src/modules/orders/application/OrderService.js";

test("exige una clave de idempotencia al confirmar una compra", async () => {
  const service = new OrderService({ create: () => null });
  assert.throws(() => service.create({ id: "user-1" }, { items: [] }), { code: "IDEMPOTENCY_KEY_REQUIRED" });
});
