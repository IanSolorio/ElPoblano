import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminUser,
  createCategory,
  createPromotion,
  getAdminOrder,
  getAdminOrderStatistics,
  listAdminCategories,
  listAdminOrders,
  listAdminPromotions,
  listAdminUsers,
  listCategories,
  removePromotion,
  setUserStatus,
  updateAdminOrderStatus,
  updateCategory,
} from "../src/modules/admin/infrastructure/adminApi.js";

describe("API administrativa", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 204, ok: true }));
  });

  it("UT-FE-21: valida rutas administrativas y procesa sus respuestas", async () => {
    const uuid = "123e4567-e89b-42d3-a456-426614174000";

    await setUserStatus(uuid, false);
    await removePromotion(uuid);
    await updateCategory(7, { active: false });
    await getAdminOrder(uuid);
    await updateAdminOrderStatus(uuid, "PREPARING");

    expect(fetch.mock.calls.map(([url]) => new URL(url, "http://local.test").pathname)).toEqual([
      `/api/admin/usuarios/${uuid}/status`,
      `/api/promociones/${uuid}`,
      "/api/categorias/7",
      `/api/pedidos/admin/${uuid}`,
      `/api/pedidos/admin/${uuid}/status`,
    ]);

    expect(() => setUserStatus("../otro", true)).toThrow("Identificador administrativo inválido");
    expect(() => updateCategory("7?admin=true", {})).toThrow("Identificador administrativo inválido");

    fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({ data: [] }) });
    await listAdminUsers();
    await createAdminUser({ email: "admin@example.com" });
    await listAdminPromotions();
    await createPromotion({ name: "Combo" });
    await listCategories();
    await listAdminCategories();
    await createCategory("Tacos");
    await listAdminOrders();
    await listAdminOrders({ page: 2, limit: 10, status: "CONFIRMED", search: "Ian" });
    await getAdminOrderStatistics("2026-08");

    expect(fetch.mock.calls.some(([url]) => String(url).includes("status=CONFIRMED&search=Ian"))).toBe(true);

    fetch.mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) });
    await expect(listAdminUsers()).rejects.toThrow("Tu sesión expiró");

    fetch.mockResolvedValueOnce({ status: 422, ok: false, json: async () => ({ message: "Dato inválido" }) });
    await expect(listAdminUsers()).rejects.toThrow("Dato inválido");

    fetch.mockResolvedValueOnce({ status: 500, ok: false, json: async () => ({}) });
    await expect(listAdminUsers()).rejects.toThrow("No se pudo completar la operación");
  });
});
