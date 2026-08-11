import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminOrder,
  removePromotion,
  setUserStatus,
  updateAdminOrderStatus,
  updateCategory,
} from "../src/modules/admin/infrastructure/adminApi.js";

describe("API administrativa", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 204, ok: true }));
  });

  it("UT-FE-21: codifica identificadores antes de incorporarlos a las rutas", async () => {
    const unsafeId = "id/con espacios?admin=true";
    const safeId = encodeURIComponent(unsafeId);

    await setUserStatus(unsafeId, false);
    await removePromotion(unsafeId);
    await updateCategory(unsafeId, { active: false });
    await getAdminOrder(unsafeId);
    await updateAdminOrderStatus(unsafeId, "PREPARING");

    expect(fetch.mock.calls.map(([url]) => new URL(url, "http://local.test").pathname)).toEqual([
      `/api/admin/usuarios/${safeId}/status`,
      `/api/promociones/${safeId}`,
      `/api/categorias/${safeId}`,
      `/api/pedidos/admin/${safeId}`,
      `/api/pedidos/admin/${safeId}/status`,
    ]);
  });
});
