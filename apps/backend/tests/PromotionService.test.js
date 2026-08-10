import assert from "node:assert/strict";
import test from "node:test";
import { PromotionService } from "../src/modules/promotions/application/PromotionService.js";
import { PrismaPromotionRepository } from "../src/modules/promotions/infrastructure/PrismaPromotionRepository.js";

const productRef = (id = "11111111-1111-4111-8111-111111111111", quantity = 1) => ({ productId: id, quantity });
const base = (overrides = {}) => ({ name: "Promo", kind: "PRODUCT_DISCOUNT", discountType: "PERCENTAGE", discountValue: 20, startsAt: "2026-08-09T10:00:00.000Z", endsAt: "2026-08-10T10:00:00.000Z", active: true, products: [productRef()], ...overrides });
const productRow = (overrides = {}) => ({ id: "p1", name: "Taco", price: 10, imageUrl: "https://example.com/taco.webp", stock: 5, active: true, deletedAt: null, category: { name: "Tacos" }, ...overrides });
const promotionRow = (overrides = {}) => ({ id: "promo-1", name: "Promo", description: null, kind: "PRODUCT_DISCOUNT", discountType: "PERCENTAGE", discountValue: 20, bundlePrice: null, imageUrl: null, active: true, startsAt: new Date("2026-08-09"), endsAt: new Date("2026-08-10"), products: [{ product: productRow(), quantity: 1 }], ...overrides });

class FakePromotionRepository {
  constructor() { this.created = []; this.updated = []; this.removed = []; }
  create(data, actorId) { this.created.push({ data, actorId }); return { id: "promo", ...data }; }
  update(id, data, actorId) { this.updated.push({ id, data, actorId }); return { id, ...data }; }
  remove(id, actorId) { this.removed.push({ id, actorId }); return { id, active: false }; }
}

test("UT-PRO-01: rechaza promoción con fin anterior o igual al inicio", () => {
  const service = new PromotionService(new FakePromotionRepository()); assert.throws(() => service.create(base({ endsAt: "2026-08-09T10:00:00.000Z" }), { id: "admin" }), { code: "INVALID_PROMOTION_PERIOD" });
});

test("UT-PRO-02: rechaza porcentaje mayor a cien", () => {
  const service = new PromotionService(new FakePromotionRepository()); assert.throws(() => service.create(base({ discountValue: 101 }), { id: "admin" }), { code: "INVALID_DISCOUNT" });
});

test("UT-PRO-03: acepta descuentos porcentuales y fijos positivos", async () => {
  const repository = new FakePromotionRepository(); const service = new PromotionService(repository);
  await service.create(base(), { id: "admin" }); await service.create(base({ discountType: "FIXED_AMOUNT", discountValue: 3 }), { id: "admin" }); assert.equal(repository.created.length, 2);
});

test("UT-PRO-04: un combo necesita al menos dos productos", () => {
  const service = new PromotionService(new FakePromotionRepository()); assert.throws(() => service.create(base({ kind: "BUNDLE", bundlePrice: 15, imageUrl: "https://example.com/combo.webp", products: [productRef()] }), { id: "admin" }), { code: "INVALID_BUNDLE" });
});

test("UT-PRO-05: un combo necesita imagen representativa", () => {
  const service = new PromotionService(new FakePromotionRepository()); assert.throws(() => service.create(base({ kind: "BUNDLE", bundlePrice: 15, discountType: undefined, discountValue: undefined, products: [productRef("p1"), productRef("p2")] }), { id: "admin" }), { code: "BUNDLE_IMAGE_REQUIRED" });
});

test("UT-PRO-06: combo válido conserva composición, cantidades y precio", async () => {
  const repository = new FakePromotionRepository(); const combo = base({ kind: "BUNDLE", bundlePrice: 15, imageUrl: "https://example.com/combo.webp", products: [productRef("p1", 2), productRef("p2", 1)] });
  const result = await new PromotionService(repository).create(combo, { id: "admin" }); assert.equal(result.bundlePrice, 15); assert.deepEqual(result.products, combo.products);
});

test("UT-PRO-07: promoción individual reutiliza la imagen del producto", async () => {
  const repository = new PrismaPromotionRepository({ promotion: { findMany: async () => [promotionRow()] } }); const [result] = await repository.findActive(new Date("2026-08-09T12:00:00Z")); assert.equal(result.imageUrl, null); assert.equal(result.products[0].imagen, "https://example.com/taco.webp");
});

test("UT-PRO-08: promoción inactiva, futura o expirada queda fuera por filtro de vigencia", async () => {
  let where; const repository = new PrismaPromotionRepository({ promotion: { findMany: async (query) => { where = query.where; return []; } } }); const now = new Date(); const result = await repository.findActive(now);
  assert.equal(result.length, 0); assert.deepEqual(where, { active: true, deletedAt: null, startsAt: { lte: now }, endsAt: { gt: now } });
});

test("UT-PRO-09: promoción activa y vigente con stock aparece públicamente", async () => {
  const result = await new PrismaPromotionRepository({ promotion: { findMany: async () => [promotionRow()] } }).findActive(new Date()); assert.equal(result.length, 1); assert.equal(result[0].products.length, 1);
});

test("UT-PRO-12: editar promoción reemplaza relaciones y audita", async () => {
  const audits = []; let update; const tx = { product: { count: async () => 2 }, promotion: { findFirst: async () => ({ id: "promo-1" }), update: async (query) => { update = query.data; return promotionRow({ kind: "BUNDLE", discountType: null, discountValue: null, bundlePrice: 15, imageUrl: "https://example.com/combo.webp", products: [{ product: productRow(), quantity: 1 }, { product: productRow({ id: "p2" }), quantity: 1 }] }); } }, auditLog: { create: async ({ data }) => audits.push(data) } };
  const combo = base({ kind: "BUNDLE", bundlePrice: 15, imageUrl: "https://example.com/combo.webp", products: [productRef("p1"), productRef("p2")] });
  await new PrismaPromotionRepository({ $transaction: async (callback) => callback(tx) }).update("promo-1", combo, "admin"); assert.deepEqual(update.products.deleteMany, {}); assert.equal(update.products.create.length, 2); assert.equal(audits[0].action, "PROMOTION_UPDATED");
});

test("UT-PRO-13: retirar promoción usa eliminación lógica y auditoría", async () => {
  let removal; const audits = []; const tx = { promotion: { updateMany: async ({ data }) => { removal = data; return { count: 1 }; } }, auditLog: { create: async ({ data }) => audits.push(data) } };
  const result = await new PrismaPromotionRepository({ $transaction: async (callback) => callback(tx) }).remove("promo-1", "admin"); assert.equal(removal.active, false); assert.ok(removal.deletedAt); assert.equal(result.active, false); assert.equal(audits[0].action, "PROMOTION_REMOVED");
});

test("UT-PRO-14: combo con stock insuficiente no aparece como comprable", async () => {
  const combo = promotionRow({ kind: "BUNDLE", bundlePrice: 15, imageUrl: "x", products: [{ product: productRow({ stock: 0 }), quantity: 1 }, { product: productRow({ id: "p2" }), quantity: 1 }] });
  const result = await new PrismaPromotionRepository({ promotion: { findMany: async () => [combo] } }).findActive(new Date()); assert.deepEqual(result, []);
});
