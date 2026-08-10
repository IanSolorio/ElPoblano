import assert from "node:assert/strict";
import test from "node:test";
import { CategoryService } from "../src/modules/categories/application/CategoryService.js";
import { PrismaCategoryRepository } from "../src/modules/categories/infrastructure/PrismaCategoryRepository.js";

const category = (overrides = {}) => ({ id: 1, nombre: "Tacos", slug: "tacos", activo: true, ...overrides });

test("UT-CAT-01: el listado público solicita solo categorías activas", async () => {
  let filter; const service = new CategoryService({ findAll: async (onlyActive) => { filter = onlyActive; return [category()]; } }); const result = await service.listActive(); assert.equal(filter, true); assert.equal(result.length, 1);
});

test("UT-CAT-02: el listado administrativo solicita todas las categorías", async () => {
  let filter; const service = new CategoryService({ findAll: async (onlyActive) => { filter = onlyActive; return [category(), category({ id: 2, activo: false })]; } }); const result = await service.listAdmin(); assert.equal(filter, false); assert.equal(result.length, 2);
});

test("UT-CAT-03: crea categoría con slug normalizado y auditoría", async () => {
  const audits = []; let created; const tx = { category: { create: async ({ data }) => { created = { id: 1, ...data }; return created; } }, auditLog: { create: async ({ data }) => audits.push(data) } };
  const result = await new PrismaCategoryRepository({ $transaction: async (callback) => callback(tx) }).create("  Quesadíllas Especiales  ", "super-1");
  assert.equal(created.slug, "quesadillas-especiales"); assert.equal(result.nombre, "Quesadíllas Especiales"); assert.equal(audits[0].action, "CATEGORY_CREATED");
});

test("UT-CAT-04: un nombre o slug duplicado propaga el conflicto de unicidad", async () => {
  const duplicate = Object.assign(new Error("Unique constraint"), { code: "P2002" }); const repository = new PrismaCategoryRepository({ $transaction: async (callback) => callback({ category: { create: async () => { throw duplicate; } } }) });
  await assert.rejects(repository.create("Tacos", "super-1"), { code: "P2002" });
});

test("UT-CAT-05: actualizar categoría inexistente devuelve CATEGORY_NOT_FOUND", async () => {
  const service = new CategoryService({ findById: async () => null }); await assert.rejects(service.update(999, { nombre: "Otra" }, { id: "super" }), { code: "CATEGORY_NOT_FOUND" });
});

test("UT-CAT-06: activar o desactivar conserva productos y audita", async () => {
  let updateData; const audits = []; const tx = { category: { update: async ({ data }) => { updateData = data; return { id: 1, name: "Tacos", slug: "tacos", active: data.active }; } }, auditLog: { create: async ({ data }) => audits.push(data) } };
  const repository = new PrismaCategoryRepository({ $transaction: async (callback) => callback(tx) }); const result = await repository.update(1, { activo: false }, "super-1");
  assert.deepEqual(updateData, { active: false }); assert.equal(result.activo, false); assert.equal(audits[0].action, "CATEGORY_UPDATED"); assert.equal(updateData.products, undefined);
});
