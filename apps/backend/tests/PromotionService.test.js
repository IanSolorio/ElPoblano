import assert from "node:assert/strict";
import test from "node:test";
import { PromotionService } from "../src/modules/promotions/application/PromotionService.js";

test("rechaza promociones con fechas inválidas", () => {
  const service = new PromotionService({});
  assert.throws(() => service.create({ startsAt: "2026-08-10", endsAt: "2026-08-09", discountType: "PERCENTAGE", discountValue: 10 }, { id: "admin" }), { code: "INVALID_PROMOTION_PERIOD" });
});

test("rechaza porcentajes mayores a cien", () => {
  const service = new PromotionService({});
  assert.throws(() => service.create({ startsAt: "2026-08-09", endsAt: "2026-08-10", discountType: "PERCENTAGE", discountValue: 101 }, { id: "admin" }), { code: "INVALID_DISCOUNT" });
});
