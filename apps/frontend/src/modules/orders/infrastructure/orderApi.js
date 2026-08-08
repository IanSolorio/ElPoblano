const API_URL = import.meta.env.VITE_ENDPOINT_BASE || "/api";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "No se pudo completar la solicitud.");
  return data;
};

export const createOrder = (order, key) => request("/pedidos", { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(order) });
export const getOrderHistory = () => request("/pedidos/historial?page=1&limit=50");
export const processMercadoPagoPayment = (orderId, paymentData, key) => request("/pagos/mercadopago", {
  method: "POST",
  headers: { "Idempotency-Key": key },
  body: JSON.stringify({ orderId, paymentData }),
});
