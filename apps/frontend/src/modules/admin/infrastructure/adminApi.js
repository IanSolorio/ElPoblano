const API_URL = import.meta.env.VITE_ENDPOINT_BASE || "/api";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTEGER_ID_PATTERN = /^[1-9]\d*$/;

const validatedRouteId = (id, pattern) => {
  const value = String(id);
  if (!pattern.test(value)) throw new TypeError("Identificador administrativo inválido.");
  return value;
};

const uuidRouteId = (id) => validatedRouteId(id, UUID_PATTERN);
const integerRouteId = (id) => validatedRouteId(id, INTEGER_ID_PATTERN);
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
export const setUserStatus = (id, active) => request(`/admin/usuarios/${uuidRouteId(id)}/status`, { method: "PATCH", body: JSON.stringify({ active }) });
export const createAdminUser = (data) => request("/admin/usuarios/administradores", { method: "POST", body: JSON.stringify(data) });
export const listAdminPromotions = () => request("/promociones/admin");
export const createPromotion = (data) => request("/promociones", { method: "POST", body: JSON.stringify(data) });
export const removePromotion = (id) => request(`/promociones/${uuidRouteId(id)}`, { method: "DELETE" });
export const listCategories = () => request("/categorias");
export const listAdminCategories = () => request("/categorias/admin");
export const createCategory = (nombre) => request("/categorias", { method: "POST", body: JSON.stringify({ nombre }) });
export const updateCategory = (id, data) => request(`/categorias/${integerRouteId(id)}`, { method: "PATCH", body: JSON.stringify(data) });
export const listAdminOrders = ({ page = 1, limit = 12, status = "", search = "" } = {}) => {
  const query = new URLSearchParams({ page, limit });
  if (status) query.set("status", status);
  if (search) query.set("search", search);
  return request(`/pedidos/admin?${query}`);
};
export const getAdminOrder = (id) => request(`/pedidos/admin/${uuidRouteId(id)}`);
export const updateAdminOrderStatus = (id, status) => request(`/pedidos/admin/${uuidRouteId(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const getAdminOrderStatistics = (month) => request(`/pedidos/admin-estadisticas?month=${encodeURIComponent(month)}`);
