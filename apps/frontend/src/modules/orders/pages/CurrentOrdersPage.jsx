import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FaBagShopping, FaBan, FaCircleCheck, FaClock, FaCreditCard, FaFireBurner, FaLocationDot, FaMotorcycle, FaRotate } from "react-icons/fa6";
import { useAuth } from "../../auth/application/AuthContext";
import MercadoPagoPayment from "../../payments/components/MercadoPagoPayment";
import { cancelPendingOrder, getCurrentOrders } from "../infrastructure/orderApi";
import "../../../css/PedidosCliente.css";

const steps = [
  { status: "CONFIRMED", label: "Confirmado", detail: "Recibimos tu pago", icon: FaCircleCheck },
  { status: "PREPARING", label: "Preparando", detail: "La cocina trabaja en tu pedido", icon: FaFireBurner },
  { status: "READY", label: "Listo", detail: "Está listo para salir", icon: FaBagShopping },
  { status: "OUT_FOR_DELIVERY", label: "En camino", detail: "Va hacia tu dirección", icon: FaMotorcycle },
];
const rank = Object.fromEntries(steps.map((step, index) => [step.status, index]));
const money = (value) => `S/ ${Number(value).toFixed(2)}`;

export default function CurrentOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setOrders(await getCurrentOrders()); setError(""); }
    catch (loadError) { setError(loadError.message); }
    finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    load();
    const timer = window.setInterval(() => load(true), 30000);
    return () => window.clearInterval(timer);
  }, [user, load]);

  const cancelOrder = async (order) => {
    if (!window.confirm(`¿Cancelar el pedido #${order.id.slice(0, 8).toUpperCase()}? El stock reservado volverá a estar disponible.`)) return;
    setBusyOrderId(order.id); setError("");
    try {
      await cancelPendingOrder(order.id);
      setPayingOrderId(null);
      await load(true);
    } catch (cancelError) { setError(cancelError.message); }
    finally { setBusyOrderId(null); }
  };

  const paymentFinished = async () => {
    setPayingOrderId(null);
    setBusyOrderId(null);
    await load(true);
  };

  if (authLoading) return <p className="container py-5">Cargando...</p>;
  if (!user) return <Navigate to="/productos" replace />;

  return <main className="customer-orders-page"><section className="container">
    <header className="customer-orders-heading"><span><FaClock /> Seguimiento de pedidos</span><h1>¿Cómo va tu pedido?</h1><p>Aquí encontrarás tus compras que todavía están siendo preparadas o entregadas.</p><div><Link to="/historial">Ver historial mensual</Link><button onClick={() => load()}><FaRotate /> Actualizar</button></div></header>
    {error && <div className="customer-order-error">{error}</div>}
    {loading ? <div className="customer-orders-empty">Cargando tus pedidos...</div> : !orders.length ? <div className="customer-orders-empty"><FaBagShopping /><h2>No tienes pedidos en curso</h2><p>Todos tus pedidos están entregados o todavía no realizaste una compra.</p><Link to="/productos">Pedir ahora</Link></div> : <div className="current-orders">{orders.map((order) => {
      const currentRank = rank[order.status] ?? -1;
      const paymentPending = order.status === "PENDING" && order.payment?.status === "PENDING";
      const providerProcessing = paymentPending && Boolean(order.payment?.externalId);
      const canManagePayment = paymentPending && !providerProcessing;
      const paymentOpen = payingOrderId === order.id;
      return <article className="current-order-card" key={order.id}>
        <header><div><span>Pedido #{order.id.slice(0, 8).toUpperCase()}</span><small>{new Date(order.createdAt).toLocaleString("es-PE")}</small></div><strong>{money(order.total)}</strong></header>
        {order.status === "PENDING" ? <>
          <div className="current-order-payment"><FaClock /><div><strong>{providerProcessing ? "Pago en procesamiento" : "Pago pendiente"}</strong><p>{providerProcessing ? "Mercado Pago está validando la operación. No realices otro pago." : "Puedes completar el pago o cancelar este pedido antes de que sea procesado."}</p></div></div>
          {canManagePayment && <div className="current-order-actions">
            <button className="current-order-pay" disabled={busyOrderId === order.id} onClick={() => setPayingOrderId(paymentOpen ? null : order.id)}><FaCreditCard /> {paymentOpen ? "Ocultar pago" : "Pagar pedido"}</button>
            <button className="current-order-cancel" disabled={busyOrderId === order.id} onClick={() => cancelOrder(order)}><FaBan /> {busyOrderId === order.id ? "Cancelando..." : "Cancelar pedido"}</button>
          </div>}
          {paymentOpen && canManagePayment && <section className="current-order-checkout"><h3>Completa el pago</h3><p>Mercado Pago procesará el importe pendiente de {money(order.total)}.</p><MercadoPagoPayment
            order={order}
            user={user}
            onStatus={(status) => {
              setBusyOrderId(status ? order.id : null);
              if (!status) load(true);
            }}
            onError={(message) => setError(message)}
            onRejected={paymentFinished}
            onApproved={paymentFinished}
          /></section>}
        </> : <div className="order-timeline" aria-label="Estado del pedido">{steps.map((step, index) => {
          const Icon = step.icon;
          const complete = index <= currentRank;
          const current = index === currentRank;
          return <div className={[complete && "complete", current && "current"].filter(Boolean).join(" ")} aria-current={current ? "step" : undefined} key={step.status}>
            <span><Icon /></span>
            <div className="order-timeline__copy"><strong>{step.label}</strong><small>{step.detail}</small></div>
          </div>;
        })}</div>}
        <div className="current-order-summary"><div><h3>Tu pedido</h3>{order.items.map((item) => <p key={item.id}><span>{item.quantity}× {item.productName}{item.promotionName && <small>{item.promotionName}</small>}</span><b>{money(item.subtotal)}</b></p>)}</div><aside><FaLocationDot /><span><small>Dirección de entrega</small>{order.deliveryAddress}</span></aside></div>
      </article>;
    })}</div>}
  </section></main>;
}
