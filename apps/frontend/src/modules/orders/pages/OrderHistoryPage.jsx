import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FaBagShopping, FaCalendarDays, FaChevronDown, FaReceipt } from "react-icons/fa6";
import { useAuth } from "../../auth/application/AuthContext";
import { getMonthlyOrderHistory } from "../infrastructure/orderApi";
import "../../../css/PedidosCliente.css";

const monthName = (month) => new Date(`${month}-01T12:00:00`).toLocaleDateString("es-PE", { month: "long", year: "numeric" });
const money = (value) => `S/ ${Number(value).toFixed(2)}`;

export default function OrderHistoryPage() {
  const { user, loading } = useAuth();
  const [months, setMonths] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { if (user) getMonthlyOrderHistory().then(setMonths).catch((historyError) => setError(historyError.message)); }, [user]);
  if (loading) return <p className="container py-5">Cargando...</p>;
  if (!user) return <Navigate to="/productos" replace />;
  return <main className="customer-orders-page"><section className="container"><header className="customer-orders-heading"><span><FaCalendarDays /> Historial de compras</span><h1>Tu recorrido de sabores</h1><p>Consulta cuánto compraste cada mes y revisa los pedidos que ya fueron entregados.</p><Link to="/mis-pedidos">Ver pedidos actuales</Link></header>
    {error && <div className="customer-order-error">{error}</div>}
    {!months.length && !error ? <div className="customer-orders-empty"><FaBagShopping /><h2>Aún no tienes pedidos entregados</h2><p>Cuando recibas un pedido aparecerá agrupado en este historial.</p><Link to="/productos">Explorar la carta</Link></div> : <div className="monthly-history">{months.map((group) => <article key={group.month} className="monthly-history__card"><header><div><span><FaCalendarDays /></span><div><h2>{monthName(group.month)}</h2><p>{group.orderCount} {group.orderCount === 1 ? "compra entregada" : "compras entregadas"}</p></div></div><strong>{money(group.totalSpent)}</strong></header><div className="monthly-history__orders">{group.orders.map((order) => <details key={order.id}><summary><span><FaReceipt /> Pedido #{order.id.slice(0, 8).toUpperCase()}</span><span>{new Date(order.createdAt).toLocaleDateString("es-PE")}</span><b>{money(order.total)}</b><FaChevronDown /></summary><div>{order.items.map((item) => <p key={item.id}><span>{item.quantity}× {item.productName}{item.promotionName && <small>{item.promotionName}</small>}</span><b>{money(item.subtotal)}</b></p>)}<footer>Entregado en: {order.deliveryAddress}</footer></div></details>)}</div></article>)}</div>}
  </section></main>;
}
