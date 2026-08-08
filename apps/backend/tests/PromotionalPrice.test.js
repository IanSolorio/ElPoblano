import assert from "node:assert/strict";
import test from "node:test";
import { calculatePromotionalPrice } from "../src/modules/orders/infrastructure/PrismaOrderRepository.js";

test("aplica el mejor precio promocional disponible", () => {
  const price = calculatePromotionalPrice({
    price: 20,
    promotions: [
      { promotion: { discountType: "PERCENTAGE", discountValue: 25 } },
      { promotion: { discountType: "FIXED_AMOUNT", discountValue: 8 } },
    ],
  });
  assert.equal(price, 12);
});

test("una promoción nunca genera un precio negativo", () => {
  const price = calculatePromotionalPrice({
    price: 5,
    promotions: [{ promotion: { discountType: "FIXED_AMOUNT", discountValue: 10 } }],
  });
  assert.equal(price, 0);
});
