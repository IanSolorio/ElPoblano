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

test("un combo necesita al menos dos productos", () => {
  const service = new PromotionService({});
  assert.throws(() => service.create({
    kind: "BUNDLE", startsAt: "2026-08-09", endsAt: "2026-08-10",
    imageUrl: "https://example.com/combo.webp", products: [{ productId: "one", quantity: 1 }],
  }, { id: "admin" }), { code: "INVALID_BUNDLE" });
});

test("un combo necesita una imagen representativa", () => {
  const service = new PromotionService({});
  assert.throws(() => service.create({
    kind: "BUNDLE", startsAt: "2026-08-09", endsAt: "2026-08-10",
    products: [{ productId: "one", quantity: 1 }, { productId: "two", quantity: 1 }],
  }, { id: "admin" }), { code: "BUNDLE_IMAGE_REQUIRED" });
});
