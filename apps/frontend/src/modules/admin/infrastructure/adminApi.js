const API_URL = import.meta.env.VITE_ENDPOINT_BASE || "/api";
const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...options.headers }, ...options });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión expiró. Inicia sesión nuevamente antes de continuar.");
    throw new Error(data?.message || "No se pudo completar la operación.");
  }
  return data;
};
export const listAdminUsers = () => request("/admin/usuarios");
export const setUserStatus = (id, active) => request(`/admin/usuarios/${id}/status`, { method: "PATCH", body: JSON.stringify({ active }) });
export const createAdminUser = (data) => request("/admin/usuarios/administradores", { method: "POST", body: JSON.stringify(data) });
export const listAdminPromotions = () => request("/promociones/admin");
export const createPromotion = (data) => request("/promociones", { method: "POST", body: JSON.stringify(data) });
export const removePromotion = (id) => request(`/promociones/${id}`, { method: "DELETE" });
export const listCategories = () => request("/categorias");
export const listAdminCategories = () => request("/categorias/admin");
export const createCategory = (nombre) => request("/categorias", { method: "POST", body: JSON.stringify({ nombre }) });
export const updateCategory = (id, data) => request(`/categorias/${id}`, { method: "PATCH", body: JSON.stringify(data) });
