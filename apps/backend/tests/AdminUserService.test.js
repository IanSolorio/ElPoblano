import assert from "node:assert/strict";
import test from "node:test";
import { AdminUserService } from "../src/modules/admin/application/AdminUserService.js";
import { PrismaAdminUserRepository } from "../src/modules/admin/infrastructure/PrismaAdminUserRepository.js";

class FakeAdminRepository {
  constructor(users = []) { this.users = users; this.audits = []; this.revokedUsers = []; }
  findById(id) { return this.users.find((user) => user.id === id) ?? null; }
  findByEmail(email) { return this.users.find((user) => user.email === email) ?? null; }
  findAll(query) { return { data: this.users.slice((query.page - 1) * query.limit, query.page * query.limit), pagination: { ...query, total: this.users.length } }; }
  createAdmin(data, actorId) { const user = { id: "admin-new", role: "ADMIN", active: true, ...data }; delete user.passwordHash; this.users.push(user); this.audits.push({ actorId, action: "ADMIN_CREATED" }); return user; }
  update(id, data, actorId) { const user = this.findById(id); Object.assign(user, data); this.audits.push({ actorId, action: "USER_UPDATED" }); return user; }
  setStatus(id, active, actorId) { const user = this.findById(id); user.active = active; if (!active) this.revokedUsers.push(id); this.audits.push({ actorId, action: active ? "USER_ACTIVATED" : "USER_DEACTIVATED" }); return user; }
  remove(id, actorId) { const user = this.findById(id); user.active = false; user.deletedAt = new Date(); this.revokedUsers.push(id); this.audits.push({ actorId, action: "USER_DELETED" }); return user; }
}

const hasher = { hash: async (value) => `hash:${value}` };
const customer = (overrides = {}) => ({ id: "customer-1", email: "cliente@example.com", role: "CUSTOMER", active: true, deletedAt: null, ...overrides });
const admin = (overrides = {}) => ({ id: "admin-1", email: "admin@example.com", role: "ADMIN", active: true, deletedAt: null, ...overrides });
const superAdmin = (overrides = {}) => ({ id: "super-1", email: "super@example.com", role: "SUPER_ADMIN", active: true, deletedAt: null, ...overrides });
const adminData = { email: "NUEVO@EXAMPLE.COM", password: "clave-segura", firstName: "Nuevo", lastName: "Admin" };

test("UT-USR-01: SUPER_ADMIN crea un administrador cifrado, normalizado y auditado", async () => {
  const repository = new FakeAdminRepository(); let received;
  repository.createAdmin = (data, actorId) => { received = { data, actorId }; repository.audits.push({ actorId, action: "ADMIN_CREATED" }); return { id: "new", email: data.email, role: "ADMIN" }; };
  const result = await new AdminUserService(repository, hasher).createAdmin(adminData, superAdmin());
  assert.equal(received.data.email, "nuevo@example.com"); assert.equal(received.data.passwordHash, "hash:clave-segura"); assert.equal(received.actorId, "super-1"); assert.equal(result.role, "ADMIN");
});

test("UT-USR-02: ADMIN no puede crear administradores", async () => {
  await assert.rejects(new AdminUserService(new FakeAdminRepository(), hasher).createAdmin(adminData, admin()), { code: "SUPER_ADMIN_REQUIRED" });
});

test("UT-USR-03: rechaza el correo de administrador existente", async () => {
  const service = new AdminUserService(new FakeAdminRepository([admin({ email: "nuevo@example.com" })]), hasher);
  await assert.rejects(service.createAdmin(adminData, superAdmin()), { code: "EMAIL_ALREADY_EXISTS" });
});

test("UT-USR-04: ADMIN actualiza y audita a un cliente", async () => {
  const repository = new FakeAdminRepository([customer()]); const result = await new AdminUserService(repository, hasher).update("customer-1", { firstName: "Ana" }, admin());
  assert.equal(result.firstName, "Ana"); assert.equal(repository.audits[0].action, "USER_UPDATED");
});

test("UT-USR-05: ADMIN no actualiza a otro administrador", async () => {
  await assert.rejects(new AdminUserService(new FakeAdminRepository([admin({ id: "admin-2" })]), hasher).update("admin-2", { firstName: "X" }, admin()), { code: "SUPER_ADMIN_REQUIRED" });
});

test("UT-USR-06: SUPER_ADMIN actualiza a otro administrador", async () => {
  const repository = new FakeAdminRepository([admin({ id: "admin-2" })]); const result = await new AdminUserService(repository, hasher).update("admin-2", { firstName: "Editado" }, superAdmin()); assert.equal(result.firstName, "Editado");
});

test("UT-USR-07: usuario inexistente o retirado produce USER_NOT_FOUND", async () => {
  const service = new AdminUserService(new FakeAdminRepository([customer({ id: "retirado", deletedAt: new Date() })]), hasher);
  await assert.rejects(service.update("no-existe", {}, admin()), { code: "USER_NOT_FOUND" }); await assert.rejects(service.update("retirado", {}, admin()), { code: "USER_NOT_FOUND" });
});

test("UT-USR-08: desactivar cliente revoca sesiones y audita", async () => {
  const repository = new FakeAdminRepository([customer()]); const result = await new AdminUserService(repository, hasher).setStatus("customer-1", false, admin());
  assert.equal(result.active, false); assert.deepEqual(repository.revokedUsers, ["customer-1"]); assert.equal(repository.audits[0].action, "USER_DEACTIVATED");
});

test("UT-USR-09: reactivar cliente conserva el registro y audita", async () => {
  const repository = new FakeAdminRepository([customer({ active: false })]); const result = await new AdminUserService(repository, hasher).setStatus("customer-1", true, admin());
  assert.equal(result.active, true); assert.equal(result.deletedAt, null); assert.equal(repository.audits[0].action, "USER_ACTIVATED");
});

test("UT-USR-10: un actor no puede desactivarse a sí mismo", async () => {
  await assert.rejects(new AdminUserService(new FakeAdminRepository([admin()]), hasher).setStatus("admin-1", false, admin()), { code: "SELF_DEACTIVATION" });
});

test("UT-USR-11: retirar usuario usa eliminación lógica y preserva el registro", async () => {
  const repository = new FakeAdminRepository([customer()]); await new AdminUserService(repository, hasher).remove("customer-1", admin());
  assert.equal(repository.users.length, 1); assert.equal(repository.users[0].active, false); assert.ok(repository.users[0].deletedAt);
});

test("UT-USR-12: listado pagina y no expone contraseñas", async () => {
  const rows = [customer({ id: "1", passwordHash: "secret" }), customer({ id: "2", passwordHash: "secret" })];
  const prisma = { user: { findMany: async () => rows, count: async () => 2 }, $transaction: async (operations) => Promise.all(operations) };
  const result = await new PrismaAdminUserRepository(prisma).findAll({ page: 1, limit: 1 });
  assert.equal(result.pagination.pages, 2); assert.equal(result.data[0].passwordHash, undefined);
});
