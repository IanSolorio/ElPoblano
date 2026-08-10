import assert from "node:assert/strict";
import test from "node:test";
import { Product } from "../src/modules/products/domain/Product.js";
import { ProductService } from "../src/modules/products/application/ProductService.js";
import { PrismaProductRepository } from "../src/modules/products/infrastructure/PrismaProductRepository.js";

const data = (overrides = {}) => ({ nombre: "Taco al pastor", descripcion: "Taco con carne al pastor", categoriaId: 1, precio: 8, imagen: "https://example.com/taco.webp", stock: 5, activo: true, ...overrides });
const row = (overrides = {}) => ({ id: "product-1", name: "Taco al pastor", description: "Taco con carne", price: 8, imageUrl: null, stock: 5, active: true, deletedAt: null, category: { id: 1, name: "Tacos" }, ...overrides });

class FakeProductRepository {
  constructor(products = [], categoryActive = true) { this.products = products; this.categoryActive = categoryActive; this.calls = []; }
  categoryIsActive() { return this.categoryActive; }
  findAll() { return this.products.filter((p) => p.activo && !p.deletedAt && p.stock > 0); }
  findAllAdmin() { return this.products.filter((p) => !p.deletedAt); }
  findById(id) { return this.products.find((p) => p.id === id && !p.deletedAt) ?? null; }
  create(product, actorId) { this.products.push(product); this.calls.push({ action: "PRODUCT_CREATED", actorId }); return product; }
  update(id, product, actorId) { const index = this.products.findIndex((p) => p.id === id); this.products[index] = product; this.calls.push({ action: "PRODUCT_UPDATED", actorId }); return product; }
  delete(id, actorId) { const product = this.products.find((p) => p.id === id); product.activo = false; product.deletedAt = new Date(); this.calls.push({ action: "PRODUCT_RETIRED", actorId }); return product; }
}

test("UT-PRD-01: construye un producto válido conservando todos sus campos", () => {
  const product = new Product({ id: "p1", ...data() }); assert.deepEqual({ ...product }, { id: "p1", ...data() });
});

test("UT-PRD-02: crea un producto con categoría activa y actor de auditoría", async () => {
  const repository = new FakeProductRepository(); const product = await new ProductService(repository).create(data(), { id: "admin-1" });
  assert.ok(product.id); assert.deepEqual(repository.calls[0], { action: "PRODUCT_CREATED", actorId: "admin-1" });
});

test("UT-PRD-03: rechaza crear o editar con categoría inactiva", async () => {
  const repository = new FakeProductRepository([{ id: "p1", ...data() }], false); const service = new ProductService(repository);
  await assert.rejects(service.create(data(), { id: "admin" }), { code: "INVALID_CATEGORY" }); await assert.rejects(service.update("p1", data(), { id: "admin" }), { code: "INVALID_CATEGORY" });
});

test("UT-PRD-04: consultar un producto inexistente devuelve 404", async () => {
  await assert.rejects(new ProductService(new FakeProductRepository()).getById("missing"), { status: 404 });
});

test("UT-PRD-05: edita un producto existente y registra al actor", async () => {
  const repository = new FakeProductRepository([{ id: "p1", ...data() }]); const updated = await new ProductService(repository).update("p1", data({ precio: 10 }), { id: "admin-1" });
  assert.equal(updated.precio, 10); assert.equal(repository.calls[0].action, "PRODUCT_UPDATED"); assert.equal(repository.calls[0].actorId, "admin-1");
});

test("UT-PRD-06: cambiar stock registra un movimiento por la diferencia", async () => {
  const movements = []; const audits = []; const transaction = {
    product: { findUniqueOrThrow: async () => ({ stock: 3 }), update: async () => row({ stock: 8 }) },
    inventoryMovement: { create: async ({ data: movement }) => movements.push(movement) }, auditLog: { create: async ({ data: audit }) => audits.push(audit) },
  };
  const prisma = { $transaction: async (callback) => callback(transaction) };
  await new PrismaProductRepository(prisma).update("product-1", new Product({ id: "product-1", ...data({ stock: 8 }) }), "admin-1");
  assert.equal(movements[0].quantity, 5); assert.equal(movements[0].type, "ADJUSTMENT"); assert.deepEqual(audits[0].metadata, { previousStock: 3, newStock: 8 });
});

test("UT-PRD-07: retirar producto usa eliminación lógica y auditoría", async () => {
  let updateData; const audits = []; const transaction = { product: { update: async ({ data: persistence }) => { updateData = persistence; return row({ active: false, deletedAt: persistence.deletedAt }); } }, auditLog: { create: async ({ data: audit }) => audits.push(audit) } };
  await new PrismaProductRepository({ $transaction: async (callback) => callback(transaction) }).delete("product-1", "admin-1");
  assert.equal(updateData.active, false); assert.ok(updateData.deletedAt instanceof Date); assert.equal(audits[0].action, "PRODUCT_RETIRED");
});

test("UT-PRD-08: listado público filtra retirados, inactivos, stock cero y categoría inactiva", async () => {
  let where; const prisma = { product: { findMany: async (query) => { where = query.where; return [row()]; } } };
  const result = await new PrismaProductRepository(prisma).findAll();
  assert.deepEqual(where, { active: true, deletedAt: null, stock: { gt: 0 }, category: { active: true } }); assert.equal(result.length, 1);
});

test("UT-PRD-09: listado administrativo incluye stock cero e inactivos no retirados", async () => {
  let where; const prisma = { product: { findMany: async (query) => { where = query.where; return [row({ stock: 0, active: false })]; } } };
  const result = await new PrismaProductRepository(prisma).findAllAdmin(); assert.deepEqual(where, { deletedAt: null }); assert.equal(result[0].stock, 0); assert.equal(result[0].activo, false);
});
