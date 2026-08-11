import assert from "node:assert/strict";
import test from "node:test";
import { AuthService } from "../src/modules/auth/application/AuthService.js";
import { createAuthenticationMiddleware, extractSessionToken, requireAdmin, requireSuperAdmin } from "../src/modules/auth/presentation/authMiddleware.js";
import { passwordHasher } from "../src/modules/auth/infrastructure/passwordHasher.js";
import { createSessionToken, hashSessionToken } from "../src/shared/security/sessionToken.js";

class FakeAuthRepository {
  constructor(users = []) { this.users = users; this.sessions = []; this.audits = []; }
  findByEmail(email) { return this.users.find((user) => user.email === email) ?? null; }
  createUser(data) { const { addresses, ...fields } = data; const user = { id: `user-${this.users.length + 1}`, role: "CUSTOMER", active: true, ...fields, addresses: [{ id: "address-1", ...addresses.create }] }; this.users.push(user); return user; }
  createSession(data) { this.sessions.push(data); return data; }
  findActiveSession(tokenHash) { const session = this.sessions.find((item) => item.tokenHash === tokenHash && !item.revokedAt && item.expiresAt > new Date()); const user = session && this.users.find((item) => item.id === session.userId); return session && user ? { ...session, user } : null; }
  revokeSession(tokenHash) { const session = this.sessions.find((item) => item.tokenHash === tokenHash); if (session) session.revokedAt = new Date(); }
  writeAudit(entry) { this.audits.push(entry); }
}

const fakeHasher = { hash: async (value) => `hashed:${value}`, verify: async (hash, value) => hash === `hashed:${value}` };
const registration = (overrides = {}) => ({ email: "CLIENTE@EXAMPLE.COM", password: "clave-segura", firstName: " Ana ", lastName: " Pérez ", phone: " 999111222 ", address: { label: "Casa", addressLine: "Av. Principal 123", reference: "Puerta roja", latitude: -12.0464, longitude: -77.0428 }, ...overrides });
const existingUser = (overrides = {}) => ({ id: "user-1", email: "cliente@example.com", passwordHash: "hashed:clave-segura", firstName: "Ana", lastName: "Pérez", phone: null, role: "CUSTOMER", active: true, addresses: [], ...overrides });

test("UT-AUTH-01: registra datos válidos, dirección, auditoría y sesión", async () => {
  const repository = new FakeAuthRepository(); const service = new AuthService(repository, fakeHasher);
  const result = await service.register(registration());
  assert.equal(repository.users[0].passwordHash, "hashed:clave-segura");
  assert.equal(repository.users[0].addresses[0].isDefault, true);
  assert.equal(repository.audits[0].action, "USER_REGISTERED");
  assert.equal(repository.sessions[0].userId, result.user.id);
});

test("UT-AUTH-02: rechaza correo existente sin distinguir mayúsculas", async () => {
  const service = new AuthService(new FakeAuthRepository([existingUser()]), fakeHasher);
  await assert.rejects(service.register(registration()), { code: "EMAIL_ALREADY_EXISTS" });
});

test("UT-AUTH-03: normaliza nombres, teléfono y correo", async () => {
  const repository = new FakeAuthRepository(); const service = new AuthService(repository, fakeHasher);
  await service.register(registration());
  assert.deepEqual({ email: repository.users[0].email, firstName: repository.users[0].firstName, lastName: repository.users[0].lastName, phone: repository.users[0].phone }, { email: "cliente@example.com", firstName: "Ana", lastName: "Pérez", phone: "999111222" });
});

test("UT-AUTH-04: inicia sesión y respeta la expiración configurada", async () => {
  const repository = new FakeAuthRepository([existingUser()]); const before = Date.now();
  const result = await new AuthService(repository, fakeHasher, 3).login(" CLIENTE@example.com ", "clave-segura");
  assert.equal(result.user.id, "user-1"); assert.ok(result.expiresAt.getTime() >= before + 3 * 86400000); assert.equal(repository.audits[0].action, "USER_LOGGED_IN");
});

test("UT-AUTH-05: rechaza contraseña incorrecta sin revelar el correo", async () => {
  const service = new AuthService(new FakeAuthRepository([existingUser()]), fakeHasher);
  await assert.rejects(service.login("cliente@example.com", "incorrecta"), { code: "INVALID_CREDENTIALS", status: 401 });
});

test("UT-AUTH-06: usa el mismo error para un usuario inexistente", async () => {
  await assert.rejects(new AuthService(new FakeAuthRepository(), fakeHasher).login("nadie@example.com", "clave"), { code: "INVALID_CREDENTIALS", status: 401 });
});

test("UT-AUTH-07: impide el login de un usuario inactivo", async () => {
  await assert.rejects(new AuthService(new FakeAuthRepository([existingUser({ active: false })]), fakeHasher).login("cliente@example.com", "clave-segura"), { code: "INVALID_CREDENTIALS" });
});

test("UT-AUTH-08: exige token para autenticar", async () => {
  await assert.rejects(new AuthService(new FakeAuthRepository(), fakeHasher).authenticate(), { code: "AUTHENTICATION_REQUIRED" });
});

test("UT-AUTH-09: rechaza tokens inexistentes, expirados y revocados", async () => {
  const repository = new FakeAuthRepository([existingUser()]); const service = new AuthService(repository, fakeHasher);
  await assert.rejects(service.authenticate("inexistente"), { code: "INVALID_SESSION" });
  repository.sessions.push({ userId: "user-1", tokenHash: hashSessionToken("expirado"), expiresAt: new Date(0) });
  await assert.rejects(service.authenticate("expirado"), { code: "INVALID_SESSION" });
  repository.sessions.push({ userId: "user-1", tokenHash: hashSessionToken("revocado"), expiresAt: new Date(Date.now() + 10000), revokedAt: new Date() });
  await assert.rejects(service.authenticate("revocado"), { code: "INVALID_SESSION" });
});

test("UT-AUTH-10: cerrar sesión revoca el hash y no el token en claro", async () => {
  const repository = new FakeAuthRepository([existingUser()]); const service = new AuthService(repository, fakeHasher);
  const { token } = await service.login("cliente@example.com", "clave-segura"); await service.logout(token);
  assert.equal(repository.sessions[0].revokedAt instanceof Date, true); assert.notEqual(repository.sessions[0].tokenHash, token);
});

test("UT-AUTH-11: cerrar sesión sin token es idempotente", async () => {
  const repository = new FakeAuthRepository(); await new AuthService(repository, fakeHasher).logout(); assert.equal(repository.sessions.length, 0);
});

test("UT-AUTH-12: el usuario público no expone credenciales o sesión", async () => {
  const repository = new FakeAuthRepository([existingUser()]); const result = await new AuthService(repository, fakeHasher).login("cliente@example.com", "clave-segura");
  assert.equal(result.user.passwordHash, undefined); assert.equal(result.user.tokenHash, undefined); assert.equal(result.user.active, undefined); assert.ok(result.token);
});

test("UT-AUTH-13: Argon2 verifica solo la contraseña correcta", async () => {
  const hash = await passwordHasher.hash("contraseña-muy-segura"); assert.match(hash, /^\$argon2id\$/); assert.equal(await passwordHasher.verify(hash, "contraseña-muy-segura"), true); assert.equal(await passwordHasher.verify(hash, "otra"), false);
});

test("UT-AUTH-14: el hash de sesión es determinista y no conserva el token", () => {
  const token = createSessionToken(); assert.equal(hashSessionToken(token), hashSessionToken(token)); assert.notEqual(hashSessionToken(token), token); assert.equal(hashSessionToken(token).length, 64);
});

const authorizationResult = (middleware, role) => new Promise((resolve) => middleware({ user: role ? { role } : undefined }, {}, (error) => resolve(error)));

test("UT-AUTH-15: CUSTOMER no puede usar rutas administrativas", async () => {
  const error = await authorizationResult(requireAdmin, "CUSTOMER"); assert.equal(error.code, "FORBIDDEN");
});

test("UT-AUTH-16: ADMIN no puede usar rutas de SUPER_ADMIN", async () => {
  const error = await authorizationResult(requireSuperAdmin, "ADMIN"); assert.equal(error.code, "SUPER_ADMIN_REQUIRED");
});

test("UT-AUTH-17: ADMIN y SUPER_ADMIN son autorizados correctamente", async () => {
  assert.equal(await authorizationResult(requireAdmin, "ADMIN"), undefined); assert.equal(await authorizationResult(requireAdmin, "SUPER_ADMIN"), undefined); assert.equal(await authorizationResult(requireSuperAdmin, "SUPER_ADMIN"), undefined);
  assert.equal(extractSessionToken({ headers: { authorization: "Bearer abc", cookie: "elpoblano_session=xyz" } }), "abc");
});

test("UT-AUTH-18: middleware autentica cookies y entrega errores al manejador", async () => {
  assert.equal(extractSessionToken({ headers: { cookie: "tema=oscuro; elpoblano_session=sesion-cookie" } }), "sesion-cookie");
  const request = { headers: { cookie: "elpoblano_session=sesion-cookie" } };
  const next = (error) => { request.error = error; };
  await createAuthenticationMiddleware({ authenticate: async (token) => ({ id: "u1", token }) })(request, {}, next);
  assert.deepEqual(request.user, { id: "u1", token: "sesion-cookie" });
  assert.equal(request.error, undefined);
  await createAuthenticationMiddleware({ authenticate: async () => { throw new Error("sesión inválida"); } })(request, {}, next);
  assert.equal(request.error.message, "sesión inválida");
});
