import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/application/AuthContext";
import { getOrderHistory } from "../infrastructure/orderApi";

const paymentNames = { YAPE: "Yape", CREDIT_CARD: "Tarjeta de crédito", DEBIT_CARD: "Tarjeta de débito", PREPAID_CARD: "Tarjeta prepago" };
export default function OrderHistoryPage() {
  const { user, loading } = useAuth(); const [orders, setOrders] = useState([]); const [error, setError] = useState("");
  useEffect(() => { if (user) getOrderHistory().then((result) => setOrders(result.data)).catch((historyError) => setError(historyError.message)); }, [user]);
  if (loading) return <p className="container py-5">Cargando...</p>;
  if (!user) return <Navigate to="/productos" replace />;
  return <main className="container py-5"><h1>Mis compras</h1>{error && <div className="alert alert-danger">{error}</div>}{!orders.length && !error && <p>Aún no tienes pedidos.</p>}{orders.map((order) => <article key={order.id} className="card p-3 mb-3"><div className="d-flex justify-content-between"><strong>Pedido {order.id.slice(0, 8)}</strong><span>{new Date(order.createdAt).toLocaleString("es-PE")}</span></div><div>Entrega: {order.deliveryAddress}</div><div>Pago: {paymentNames[order.payment?.method]} — {order.payment?.status}</div>{order.items.map((item) => <div key={item.id}>{item.quantity} × {item.productName} — S/ {Number(item.subtotal).toFixed(2)}</div>)}<strong className="mt-2">Total: S/ {Number(order.total).toFixed(2)}</strong></article>)}</main>;
}
