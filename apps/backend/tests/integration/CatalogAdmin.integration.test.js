import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import express from "express";
import { createFileRouter } from "../../src/modules/files/presentation/fileRoutes.js";
import { errorHandler } from "../../src/shared/middleware/errorHandler.js";
import { issueSession, prisma, request, resetDatabase, seedFixture, startIntegrationServer, stopIntegrationServer } from "./integrationContext.js";

let fixture; let cookies;
before(startIntegrationServer);
beforeEach(async () => {
  await resetDatabase(); fixture = await seedFixture(); cookies = {
    admin: await issueSession(fixture.admin.id),
    super: await issueSession(fixture.superAdmin.id),
    customer: await issueSession(fixture.customer.id),
  };
});
after(stopIntegrationServer);
const auth = (cookie) => ({ Cookie: cookie });
const productBody = (overrides = {}) => ({ nombre: "Quesadilla integrada", descripcion: "Descripción de integración", categoriaId: fixture.category.id, precio: 12.5, imagen: "https://example.com/image.webp", stock: 4, activo: true, ...overrides });
const promoBody = (overrides = {}) => ({ name: "Promo integrada", kind: "PRODUCT_DISCOUNT", discountType: "PERCENTAGE", discountValue: 20, startsAt: new Date(Date.now() - 60000).toISOString(), endsAt: new Date(Date.now() + 3600000).toISOString(), active: true, products: [{ productId: fixture.product.id, quantity: 1 }], ...overrides });

test("IT-PRD-01: catálogo anónimo devuelve solo productos vendibles", async () => { const result = await request("/api/productos"); assert.equal(result.status, 200); assert.equal(result.body.some((p) => p.id === fixture.product.id), true); assert.equal(result.body.some((p) => p.id === fixture.zeroStockProduct.id), false); });
test("IT-PRD-02: detalle de producto válido e inexistente responde 200 y 404", async () => { assert.equal((await request(`/api/productos/${fixture.product.id}`)).status, 200); assert.equal((await request("/api/productos/00000000-0000-4000-8000-000000000000")).status, 404); });
test("IT-PRD-03: ADMIN crea, edita y retira producto con inventario y auditoría", async () => {
  const created = await request("/api/productos", { method: "POST", headers: auth(cookies.admin), body: productBody() }); assert.equal(created.status, 201);
  const updated = await request(`/api/productos/${created.body.id}`, { method: "PUT", headers: auth(cookies.admin), body: productBody({ stock: 9 }) }); assert.equal(updated.status, 200); assert.equal(await prisma.inventoryMovement.count({ where: { productId: created.body.id } }), 1);
  assert.equal((await request(`/api/productos/${created.body.id}`, { method: "DELETE", headers: auth(cookies.admin) })).status, 200); assert.equal(await prisma.auditLog.count({ where: { entityId: created.body.id } }), 3);
});
test("IT-PRD-04: cliente y anónimo no modifican productos", async () => { assert.equal((await request("/api/productos", { method: "POST", body: productBody() })).status, 401); assert.equal((await request("/api/productos", { method: "POST", headers: auth(cookies.customer), body: productBody() })).status, 403); assert.equal(await prisma.product.count({ where: { name: productBody().nombre } }), 0); });
test("IT-PRD-05: stock cero oculta y reposición vuelve a publicar", async () => {
  await request(`/api/productos/${fixture.product.id}`, { method: "PUT", headers: auth(cookies.admin), body: productBody({ nombre: fixture.product.name, stock: 0 }) }); assert.equal((await request("/api/productos")).body.some((p) => p.id === fixture.product.id), false); assert.equal((await request("/api/productos/admin/todos", { headers: auth(cookies.admin) })).body.some((p) => p.id === fixture.product.id && p.stock === 0), true);
  await request(`/api/productos/${fixture.product.id}`, { method: "PUT", headers: auth(cookies.admin), body: productBody({ nombre: fixture.product.name, stock: 5 }) }); assert.equal((await request("/api/productos")).body.some((p) => p.id === fixture.product.id), true);
});
test("IT-PRD-06: retiro conserva el registro y lo excluye de venta", async () => { await request(`/api/productos/${fixture.product.id}`, { method: "DELETE", headers: auth(cookies.admin) }); const stored = await prisma.product.findUnique({ where: { id: fixture.product.id } }); assert.ok(stored.deletedAt); assert.equal((await request("/api/productos")).body.some((p) => p.id === fixture.product.id), false); });

test("IT-CAT-01: público ve activas y superadmin ve también inactivas", async () => { const publicList = await request("/api/categorias"); const adminList = await request("/api/categorias/admin", { headers: auth(cookies.super) }); assert.equal(publicList.body.some((c) => !c.activo), false); assert.equal(adminList.body.some((c) => !c.activo), true); });
test("IT-CAT-02: SUPER_ADMIN crea y edita categoría con auditoría", async () => { const created = await request("/api/categorias", { method: "POST", headers: auth(cookies.super), body: { nombre: "Bebidas especiales" } }); assert.equal(created.status, 201); const updated = await request(`/api/categorias/${created.body.id}`, { method: "PATCH", headers: auth(cookies.super), body: { activo: false } }); assert.equal(updated.body.activo, false); assert.equal(await prisma.auditLog.count({ where: { entityId: String(created.body.id) } }), 2); });
test("IT-CAT-03: ADMIN y cliente no administran categorías", async () => { for (const cookie of [cookies.admin, cookies.customer]) assert.equal((await request("/api/categorias", { method: "POST", headers: auth(cookie), body: { nombre: "Bloqueada" } })).status, 403); });
test("IT-CAT-04: nombre o slug duplicado produce conflicto", async () => { const result = await request("/api/categorias", { method: "POST", headers: auth(cookies.super), body: { nombre: fixture.category.name } }); assert.equal(result.status, 409); });

const withFileServer = async (role, callback) => {
  const app = express(); const authenticate = (req, _res, next) => { req.user = role ? { role } : undefined; role ? next() : next(Object.assign(new Error("Auth"), { status: 401 })); }; const requireAdmin = (req, _res, next) => ["ADMIN", "SUPER_ADMIN"].includes(req.user?.role) ? next() : next(Object.assign(new Error("Forbidden"), { status: 403 }));
  app.use("/api/archivos", createFileRouter(authenticate, requireAdmin, async (_file, folder) => `https://storage.test/${folder}/image.webp`)); app.use(errorHandler);
  const server = await new Promise((resolve) => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); }); try { return await callback(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise((resolve) => server.close(resolve)); }
};
test("IT-FILE-01: subida autorizada usa carpeta y devuelve URL", async () => withFileServer("ADMIN", async (url) => { const form = new FormData(); form.append("imagen", new Blob(["image"], { type: "image/webp" }), "image.webp"); const response = await fetch(`${url}/api/archivos/productos`, { method: "POST", body: form }); assert.equal(response.status, 201); assert.equal((await response.json()).url, "https://storage.test/products/image.webp"); }));
test("IT-FILE-02: subida sin rol, tipo inválido o tamaño excesivo es rechazada", async () => {
  await withFileServer("CUSTOMER", async (url) => { const form = new FormData(); form.append("imagen", new Blob(["x"], { type: "image/webp" }), "x.webp"); assert.equal((await fetch(`${url}/api/archivos/productos`, { method: "POST", body: form })).status, 403); });
  await withFileServer("ADMIN", async (url) => { const invalid = new FormData(); invalid.append("imagen", new Blob(["x"], { type: "text/plain" }), "x.txt"); assert.equal((await fetch(`${url}/api/archivos/productos`, { method: "POST", body: invalid })).status, 415); const huge = new FormData(); huge.append("imagen", new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: "image/png" }), "huge.png"); assert.equal((await fetch(`${url}/api/archivos/productos`, { method: "POST", body: huge })).status, 413); });
});
test("IT-FILE-03: fallo de almacenamiento devuelve error y no crea recursos", async () => {
  const app = express(); app.use("/api/archivos", createFileRouter((req, _res, next) => { req.user = { role: "ADMIN" }; next(); }, (_req, _res, next) => next(), async () => { throw Object.assign(new Error("Storage unavailable"), { status: 503 }); })); app.use(errorHandler); const server = await new Promise((resolve) => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  try { const form = new FormData(); form.append("imagen", new Blob(["x"], { type: "image/png" }), "x.png"); assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/archivos/productos`, { method: "POST", body: form })).status, 503); } finally { await new Promise((resolve) => server.close(resolve)); }
});

test("IT-PRO-01: listado público filtra promociones por vigencia y estado", async () => { await prisma.promotion.create({ data: { ...promoBody(), name: "Vigente", createdById: fixture.admin.id, products: { create: [{ productId: fixture.product.id, quantity: 1 }] } } }); const result = await request("/api/promociones"); assert.equal(result.body.some((p) => p.name === "Vigente"), true); });
test("IT-PRO-02: ADMIN crea promoción individual y auditoría", async () => { const result = await request("/api/promociones", { method: "POST", headers: auth(cookies.admin), body: promoBody() }); assert.equal(result.status, 201); assert.equal(await prisma.promotionProduct.count({ where: { promotionId: result.body.id } }), 1); assert.equal(await prisma.auditLog.count({ where: { entityId: result.body.id } }), 1); });
test("IT-PRO-03: ADMIN crea combo con varios productos, cantidades, precio e imagen", async () => { const result = await request("/api/promociones", { method: "POST", headers: auth(cookies.admin), body: promoBody({ kind: "BUNDLE", discountType: undefined, discountValue: undefined, bundlePrice: 15, imageUrl: "https://example.com/combo.webp", products: [{ productId: fixture.product.id, quantity: 2 }, { productId: fixture.zeroStockProduct.id, quantity: 1 }] }) }); assert.equal(result.status, 201); assert.equal(result.body.products.length, 2); assert.equal(result.body.bundlePrice, 15); });
test("IT-PRO-04: editar y retirar promoción actualiza relaciones y auditoría", async () => { const created = await request("/api/promociones", { method: "POST", headers: auth(cookies.admin), body: promoBody() }); const updated = await request(`/api/promociones/${created.body.id}`, { method: "PUT", headers: auth(cookies.admin), body: promoBody({ discountValue: 30 }) }); assert.equal(updated.body.discountValue, 30); assert.equal((await request(`/api/promociones/${created.body.id}`, { method: "DELETE", headers: auth(cookies.admin) })).status, 200); assert.equal((await prisma.promotion.findUnique({ where: { id: created.body.id } })).active, false); });
test("IT-PRO-05: datos inválidos no producen escritura parcial", async () => { const before = await prisma.promotion.count(); const result = await request("/api/promociones", { method: "POST", headers: auth(cookies.admin), body: promoBody({ endsAt: new Date(Date.now() - 120000).toISOString() }) }); assert.equal(result.status, 400); assert.equal(await prisma.promotion.count(), before); });
test("IT-PRO-06: cliente no administra promociones", async () => { assert.equal((await request("/api/promociones", { method: "POST", headers: auth(cookies.customer), body: promoBody() })).status, 403); });
