import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import express from "express";
import { createAuthRouter } from "../../src/modules/auth/presentation/authRoutes.js";
import { login, prisma, request, resetDatabase, seedFixture, startIntegrationServer, stopIntegrationServer } from "./integrationContext.js";

let fixture;
before(startIntegrationServer);
beforeEach(async () => { await resetDatabase(); fixture = await seedFixture(); });
after(stopIntegrationServer);

test("IT-API-01: health responde sin depender de una consulta de negocio", async () => { const result = await request("/api/health"); assert.equal(result.status, 200); assert.deepEqual(result.body, { status: "ok" }); });
test("IT-API-02: ready confirma conectividad MySQL", async () => { const result = await request("/api/ready"); assert.equal(result.status, 200); assert.deepEqual(result.body, { status: "ready", database: "connected" }); });
test("IT-API-03: ruta inexistente devuelve JSON uniforme", async () => { const result = await request("/api/no-existe"); assert.equal(result.status, 404); assert.equal(result.body.code, "NOT_FOUND"); });
test("IT-API-04: CORS permite origen configurado y no autoriza otro", async () => {
  const allowed = await request("/api/health"); assert.equal(allowed.response.headers.get("access-control-allow-origin"), "http://integration.test");
  const denied = await fetch(allowed.response.url, { headers: { Origin: "https://malicioso.test" } }); assert.notEqual(denied.headers.get("access-control-allow-origin"), "https://malicioso.test");
});
test("IT-API-06: payload superior a 100 KiB es rechazado", async () => { const result = await request("/api/auth/login", { method: "POST", body: { email: "a@test.local", password: "x".repeat(110 * 1024) } }); assert.equal(result.status, 413); });
test("IT-API-07: Helmet está presente y x-powered-by ausente", async () => { const result = await request("/api/health"); assert.equal(result.response.headers.get("x-powered-by"), null); assert.ok(result.response.headers.get("x-content-type-options")); });

const registration = (overrides = {}) => ({ email: "nuevo@test.local", password: "Clave-segura-123", firstName: "Nuevo", lastName: "Cliente", phone: "999222333", address: { label: "Casa", addressLine: "Jr. Integración 456", reference: "Puerta azul", latitude: -12.04, longitude: -77.03 }, ...overrides });

test("IT-AUTH-01: registro crea usuario, dirección, sesión, auditoría y cookie", async () => {
  const result = await request("/api/auth/registro", { method: "POST", body: registration() }); assert.equal(result.status, 201); assert.ok(result.cookie?.startsWith("elpoblano_session="));
  const user = await prisma.user.findUnique({ where: { email: "nuevo@test.local" }, include: { addresses: true, sessions: true, auditLogs: true } }); assert.equal(user.addresses.length, 1); assert.equal(user.sessions.length, 1); assert.equal(user.auditLogs[0].action, "USER_REGISTERED"); assert.notEqual(user.passwordHash, registration().password);
});
test("IT-AUTH-02: registro rechaza correo, clave y coordenadas inválidas", async () => {
  for (const body of [registration({ email: "mal" }), registration({ password: "corta" }), registration({ address: { ...registration().address, latitude: 100 } })]) { const result = await request("/api/auth/registro", { method: "POST", body }); assert.equal(result.status, 422); assert.equal(result.body.code, "VALIDATION_ERROR"); }
});
test("IT-AUTH-03: registro duplicado concurrente crea una sola cuenta", async () => {
  const results = await Promise.all([request("/api/auth/registro", { method: "POST", body: registration() }), request("/api/auth/registro", { method: "POST", body: registration() })]); assert.deepEqual(results.map((item) => item.status).sort(), [201, 409]); assert.equal(await prisma.user.count({ where: { email: "nuevo@test.local" } }), 1);
});
test("IT-AUTH-04: login válido crea cookie, sesión y auditoría", async () => { const result = await login(fixture.customer.email, fixture.password); assert.equal(result.status, 200); assert.ok(result.cookie); assert.equal(await prisma.auditLog.count({ where: { userId: fixture.customer.id, action: "USER_LOGGED_IN" } }), 1); });
test("IT-AUTH-05: login inválido o inactivo responde 401 sin cookie", async () => {
  for (const [email, password] of [[fixture.customer.email, "incorrecta"], [fixture.inactiveCustomer.email, fixture.password]]) { const result = await login(email, password); assert.equal(result.status, 401); assert.equal(result.cookie, undefined); }
});
test("IT-AUTH-06: me devuelve usuario y dirección sin secretos", async () => { const session = await login(fixture.customer.email, fixture.password); const result = await request("/api/auth/me", { headers: { Cookie: session.cookie } }); assert.equal(result.status, 200); assert.equal(result.body.email, fixture.customer.email); assert.equal(result.body.addresses.length, 1); assert.equal(result.body.passwordHash, undefined); });
test("IT-AUTH-07: cookie revocada o expirada deja de autenticar", async () => {
  const session = await login(fixture.customer.email, fixture.password); await prisma.session.updateMany({ where: { userId: fixture.customer.id }, data: { expiresAt: new Date(0) } }); const result = await request("/api/auth/me", { headers: { Cookie: session.cookie } }); assert.equal(result.status, 401);
});
test("IT-AUTH-08: logout revoca sesión, borra cookie y bloquea me", async () => {
  const session = await login(fixture.customer.email, fixture.password); const logout = await request("/api/auth/logout", { method: "POST", headers: { Cookie: session.cookie } }); assert.equal(logout.status, 204); assert.match(logout.response.headers.get("set-cookie"), /Max-Age=0|Expires=/); assert.equal((await request("/api/auth/me", { headers: { Cookie: session.cookie } })).status, 401);
});
test("IT-AUTH-09: configuración productiva emite cookie HttpOnly, Secure, SameSite y Path", async () => {
  const app = express(); app.use(express.json()); app.use("/auth", createAuthRouter({ login: async () => ({ token: "token", expiresAt: new Date(Date.now() + 1000), user: { id: "u" } }) }, (_req, _res, next) => next(), { httpOnly: true, secure: true, sameSite: "lax", path: "/" }));
  const server = await new Promise((resolve) => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  try { const response = await fetch(`http://127.0.0.1:${server.address().port}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "a@test.local", password: "x" }) }); const cookie = response.headers.get("set-cookie"); assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=Lax/i); assert.match(cookie, /Path=\//i); } finally { await new Promise((resolve) => server.close(resolve)); }
});
test("IT-API-05: rate limiter responde 429 al superar 120 solicitudes", async () => {
  let last; for (let index = 0; index < 121; index += 1) last = await request("/api/health"); assert.equal(last.status, 429);
});
