import { useCallback, useEffect, useState } from "react";
import { FaArrowRight, FaCircleCheck, FaClock, FaCreditCard, FaEnvelope, FaFireBurner, FaLocationDot, FaMagnifyingGlass, FaPhone, FaReceipt, FaRotate, FaXmark } from "react-icons/fa6";
import AdminLayout from "../components/AdminLayout";
import { listAdminOrders, updateAdminOrderStatus } from "../infrastructure/adminApi";
import "../../../css/PedidosAdmin.css";

const statusInfo = {
  PENDING: { label: "Pago pendiente", className: "pending" },
  CONFIRMED: { label: "Confirmado", className: "confirmed" },
  PREPARING: { label: "En preparación", className: "preparing" },
  READY: { label: "Listo", className: "ready" },
  OUT_FOR_DELIVERY: { label: "En camino", className: "delivery" },
  DELIVERED: { label: "Entregado", className: "delivered" },
  CANCELLED: { label: "Cancelado", className: "cancelled" },
};
const paymentNames = { YAPE: "Yape", CREDIT_CARD: "Tarjeta de crédito", DEBIT_CARD: "Tarjeta de débito", PREPAID_CARD: "Tarjeta prepago" };
const nextAction = {
  CONFIRMED: { status: "PREPARING", label: "Iniciar preparación", icon: FaFireBurner },
  PREPARING: { status: "READY", label: "Marcar como listo", icon: FaCircleCheck },
  READY: { status: "OUT_FOR_DELIVERY", label: "Marcar en camino", icon: FaArrowRight },
  OUT_FOR_DELIVERY: { status: "DELIVERED", label: "Confirmar entrega", icon: FaCircleCheck },
};
const money = (value) => `S/ ${Number(value).toFixed(2)}`;
const dateTime = (value) => new Date(value).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });

export default function OrdersAdminPage() {
  const [result, setResult] = useState({ data: [], summary: {}, pagination: { page: 1, pages: 1, total: 0 } });
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setResult(await listAdminOrders({ page, status, search })); setLastUpdated(new Date()); setError(""); }
    catch (loadError) { setError(loadError.message); }
    finally { if (!quiet) setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { load(); const timer = window.setInterval(() => load(true), 10000); return () => window.clearInterval(timer); }, [load]);
  const applySearch = (event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); };
  const chooseStatus = (value) => { setPage(1); setStatus(value); };
  const updateStatus = async () => {
    const action = nextAction[selected?.status];
    if (!action) return;
    setUpdating(true); setError("");
    try { const updated = await updateAdminOrderStatus(selected.id, action.status); setSelected(updated); await load(true); }
    catch (updateError) { setError(updateError.message); }
    finally { setUpdating(false); }
  };

  const summary = result.summary || {};
  return <AdminLayout eyebrow="Operación" title="Pedidos" description="Revisa pagos confirmados y organiza la preparación de cada pedido." actions={<button className="admin-outline-action" onClick={() => load()}><FaRotate /> Actualizar</button>}>
    {error && <div className="admin-alert" role="alert">{error}</div>}
    <section className="order-stats">
      <button className={!status ? "active" : ""} onClick={() => chooseStatus("")}><span><FaReceipt /></span><div><strong>{result.pagination?.total || 0}</strong><small>Resultados</small></div></button>
      <button className={status === "CONFIRMED" ? "active" : ""} onClick={() => chooseStatus("CONFIRMED")}><span><FaClock /></span><div><strong>{summary.confirmed || 0}</strong><small>Por preparar</small></div></button>
      <button className={status === "PREPARING" ? "active" : ""} onClick={() => chooseStatus("PREPARING")}><span><FaFireBurner /></span><div><strong>{summary.preparing || 0}</strong><small>En preparación</small></div></button>
      <button className={status === "READY" ? "active" : ""} onClick={() => chooseStatus("READY")}><span><FaCircleCheck /></span><div><strong>{summary.ready || 0}</strong><small>Listos</small></div></button>
      <button className={status === "OUT_FOR_DELIVERY" ? "active" : ""} onClick={() => chooseStatus("OUT_FOR_DELIVERY")}><span><FaArrowRight /></span><div><strong>{summary.outForDelivery || 0}</strong><small>En camino</small></div></button>
    </section>

    <section className="admin-panel-card order-panel">
      <div className="admin-panel-card__toolbar"><div><h2>Cola de pedidos</h2><p>Actualización automática cada 10 segundos{lastUpdated ? ` · Última: ${lastUpdated.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}.</p></div><form className="order-search" onSubmit={applySearch}><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cliente, correo, teléfono o código" aria-label="Buscar pedidos" /><button aria-label="Buscar" title="Buscar"><FaMagnifyingGlass /></button></form></div>
      {loading ? <div className="admin-table-empty">Cargando pedidos...</div> : result.data.length === 0 ? <div className="admin-table-empty">No hay pedidos para este filtro.</div> : <div className="order-table-wrap"><table className="admin-table order-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Pago</th><th>Total</th><th>Estado</th><th /></tr></thead><tbody>{result.data.map((order) => { const state = statusInfo[order.status] || { label: order.status, className: "" }; return <tr key={order.id}><td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} unidades</small></td><td><strong>{order.customerName}</strong><small>{order.customerPhone || order.customerEmail}</small></td><td>{dateTime(order.createdAt)}</td><td><span className={`payment-state ${order.payment?.status === "APPROVED" ? "approved" : ""}`}><FaCreditCard /> {order.payment?.status === "APPROVED" ? "Aprobado" : "Pendiente"}</span></td><td><strong>{money(order.total)}</strong></td><td><span className={`order-status ${state.className}`}>{state.label}</span></td><td><button className="order-open" onClick={() => setSelected(order)}>Ver <FaArrowRight /></button></td></tr>; })}</tbody></table></div>}
      {result.pagination.pages > 1 && <div className="order-pagination"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>Página {page} de {result.pagination.pages}</span><button disabled={page >= result.pagination.pages} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div>}
    </section>

    {selected && <div className="order-detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><aside className="order-detail" aria-label="Detalle del pedido"><header><div><span>Pedido</span><h2>#{selected.id.slice(0, 8).toUpperCase()}</h2><p>{dateTime(selected.createdAt)}</p></div><button onClick={() => setSelected(null)} aria-label="Cerrar"><FaXmark /></button></header>
      <div className="order-detail__body"><section className="order-detail__status"><span className={`order-status ${statusInfo[selected.status]?.className}`}>{statusInfo[selected.status]?.label || selected.status}</span><span className={`payment-state ${selected.payment?.status === "APPROVED" ? "approved" : ""}`}><FaCreditCard /> {selected.payment?.status === "APPROVED" ? "Pago aprobado" : selected.payment?.status}</span></section>
        <section><h3>Cliente y entrega</h3><div className="order-contact"><p><FaReceipt /><span><small>Cliente</small>{selected.customerName}</span></p><p><FaPhone /><span><small>Teléfono</small>{selected.customerPhone || "No registrado"}</span></p><p><FaEnvelope /><span><small>Correo</small>{selected.customerEmail}</span></p><p><FaLocationDot /><span><small>Dirección</small>{selected.deliveryAddress}</span></p></div>{selected.deliveryLatitude && <a className="order-map-link" href={`https://www.google.com/maps?q=${selected.deliveryLatitude},${selected.deliveryLongitude}`} target="_blank" rel="noreferrer"><FaLocationDot /> Abrir punto de entrega en el mapa</a>}</section>
        <section><h3>Productos</h3><div className="order-detail__items">{selected.items.map((item) => <article key={item.id}><div><strong>{item.quantity}× {item.productName}</strong>{item.promotionName && <small>{item.promotionName}</small>}</div><b>{money(item.subtotal)}</b></article>)}</div></section>
        {selected.notes && <section><h3>Indicaciones</h3><p className="order-notes">{selected.notes}</p></section>}
        <section className="order-detail__totals"><span>Subtotal <b>{money(selected.subtotal)}</b></span><span>Envío <b>{money(selected.deliveryFee)}</b></span><strong>Total pagado <b>{money(selected.total)}</b></strong><small>{paymentNames[selected.payment?.method] || selected.payment?.method}</small></section>
      </div>
      <footer>{nextAction[selected.status] ? <button className="order-next-action" disabled={updating} onClick={updateStatus}>{(() => { const Icon = nextAction[selected.status].icon; return <Icon />; })()} {updating ? "Actualizando..." : nextAction[selected.status].label}</button> : <p>Este pedido no requiere una acción operativa.</p>}</footer>
    </aside></div>}
  </AdminLayout>;
}
