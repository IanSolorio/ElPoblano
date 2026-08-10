import assert from "node:assert/strict";
import test from "node:test";
import { calculatePromotionSelection, calculatePromotionalPrice } from "../src/modules/orders/infrastructure/PrismaOrderRepository.js";

test("UT-PRO-10: aplica el mejor precio promocional disponible", () => {
  const product = { price: 20, promotions: [
    { promotion: { id: "p1", name: "10%", discountType: "PERCENTAGE", discountValue: 10 } },
    { promotion: { id: "p2", name: "S/ 5", discountType: "FIXED_AMOUNT", discountValue: 5 } },
  ] };
  assert.equal(calculatePromotionalPrice(product), 15); assert.deepEqual(calculatePromotionSelection(product), { price: 15, promotionId: "p2", promotionName: "S/ 5" });
});

test("UT-PRO-11: una promoción nunca genera precio negativo", () => {
  assert.equal(calculatePromotionalPrice({ price: 5, promotions: [{ promotion: { id: "p", name: "Exceso", discountType: "FIXED_AMOUNT", discountValue: 10 } }] }), 0);
});
