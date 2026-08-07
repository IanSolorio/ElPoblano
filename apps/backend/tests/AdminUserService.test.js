import assert from "node:assert/strict";
import test from "node:test";
import { AdminUserService } from "../src/modules/admin/application/AdminUserService.js";

test("un ADMIN no puede crear otros administradores", async () => {
  const service = new AdminUserService({}, {});
  await assert.rejects(service.createAdmin({}, { id: "admin-1", role: "ADMIN" }), { code: "SUPER_ADMIN_REQUIRED" });
});

test("un ADMIN puede administrar clientes pero no otros administradores", async () => {
  const repository = {
    findById: async (id) => ({ id, role: id === "customer-1" ? "CUSTOMER" : "ADMIN", deletedAt: null }),
    setStatus: async (id, active) => ({ id, active }),
  };
  const service = new AdminUserService(repository, {});
  assert.equal((await service.setStatus("customer-1", false, { id: "admin-1", role: "ADMIN" })).active, false);
  await assert.rejects(service.setStatus("admin-2", false, { id: "admin-1", role: "ADMIN" }), { code: "SUPER_ADMIN_REQUIRED" });
});
