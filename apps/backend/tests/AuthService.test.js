import assert from "node:assert/strict";
import test from "node:test";
import { AuthService } from "../src/modules/auth/application/AuthService.js";

class FakeAuthRepository {
  constructor() { this.users = []; this.sessions = []; }
  findByEmail(email) { return this.users.find((user) => user.email === email) ?? null; }
  createUser(data) { const { addresses, ...userData } = data; const user = { id: "user-1", role: "CUSTOMER", active: true, ...userData, addresses: [{ id: "address-1", ...addresses.create }] }; this.users.push(user); return user; }
  createSession(data) { this.sessions.push(data); return data; }
  findActiveSession(tokenHash) { const session = this.sessions.find((item) => item.tokenHash === tokenHash && !item.revokedAt); return session ? { ...session, user: this.users[0] } : null; }
  revokeSession(tokenHash) { const session = this.sessions.find((item) => item.tokenHash === tokenHash); if (session) session.revokedAt = new Date(); }
  writeAudit() {}
}

const fakeHasher = { hash: async (value) => `hashed:${value}`, verify: async (hash, value) => hash === `hashed:${value}` };

test("registra, autentica y cierra una sesión", async () => {
  const service = new AuthService(new FakeAuthRepository(), fakeHasher);
  const registered = await service.register({ email: "CLIENTE@EXAMPLE.COM", password: "clave-segura", firstName: "Ana", lastName: "Pérez", address: { label: "Casa", addressLine: "Av. Principal 123", latitude: -12.0464, longitude: -77.0428 } });
  assert.equal(registered.user.email, "cliente@example.com");
  assert.equal((await service.authenticate(registered.token)).id, registered.user.id);
  await service.logout(registered.token);
  await assert.rejects(service.authenticate(registered.token), { code: "INVALID_SESSION" });
});
