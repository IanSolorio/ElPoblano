const API_URL = import.meta.env.VITE_ENDPOINT_BASE || "http://localhost:3000/api";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.message || "No se pudo completar la solicitud.");
  return data;
};

export const login = (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
export const register = (data) => request("/auth/registro", { method: "POST", body: JSON.stringify(data) });
export const logout = () => request("/auth/logout", { method: "POST" });
export const getCurrentUser = () => request("/auth/me");
