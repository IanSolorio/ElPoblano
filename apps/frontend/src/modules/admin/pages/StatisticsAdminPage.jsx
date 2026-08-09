import { useEffect, useState } from "react";
import { FaBagShopping, FaChartLine, FaGift, FaMoneyBillTrendUp, FaReceipt, FaUsers } from "react-icons/fa6";
import AdminLayout from "../components/AdminLayout";
import { getAdminOrderStatistics } from "../infrastructure/adminApi";
import "../../../css/EstadisticasAdmin.css";

const currentMonth = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; };
const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const monthLabel = (month) => new Date(`${month}-01T12:00:00`).toLocaleDateString("es-PE", { month: "long", year: "numeric" });
const statusLabels = { CONFIRMED: "Confirmados", PREPARING: "En preparación", READY: "Listos", OUT_FOR_DELIVERY: "En camino", DELIVERED: "Entregados" };

function Ranking({ title, subtitle, icon: Icon, items, empty }) {
  const max = Math.max(1, ...items.map((item) => item.units));
  return <section className="admin-panel-card analytics-ranking"><div className="admin-panel-card__toolbar"><div><h2>{title}</h2><p>{subtitle}</p></div><span className="admin-panel-icon"><Icon /></span></div>{items.length === 0 ? <div className="admin-table-empty">{empty}</div> : <div>{items.map((item, index) => <article key={item.productId || item.promotionId}><span className="analytics-ranking__position">{index + 1}</span><div><header><strong>{item.name}</strong><b>{item.units} {item.units === 1 ? "unidad" : "unidades"}</b></header><span className="analytics-ranking__bar"><i style={{ width: `${item.units / max * 100}%` }} /></span><small>{money(item.revenue)} generados</small></div></article>)}</div>}</section>;
}

export default function StatisticsAdminPage() {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState({ summary: {}, ordersByStatus: {}, topProducts: [], topPromotions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { setLoading(true); getAdminOrderStatistics(month).then((result) => { setData(result); setError(""); }).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false)); }, [month]);
  const summary = data.summary || {};
  const totalStatus = Math.max(1, Object.values(data.ordersByStatus || {}).reduce((sum, value) => sum + value, 0));
  return <AdminLayout eyebrow="Inteligencia de negocio" title="Estadísticas" description="Identifica qué productos y promociones generan mejores resultados." actions={<label className="analytics-month"><span>Periodo</span><input type="month" value={month} max={currentMonth()} onChange={(event) => setMonth(event.target.value)} /></label>}>
    {error && <div className="admin-alert">{error}</div>}
    {loading ? <div className="admin-panel-card admin-table-empty">Calculando estadísticas...</div> : <>
      <div className="analytics-period"><FaChartLine /><span>Resultados de <strong>{monthLabel(month)}</strong>. Solo se consideran pagos aprobados.</span></div>
      <section className="analytics-summary"><article><span><FaMoneyBillTrendUp /></span><div><small>Ingresos</small><strong>{money(summary.revenue)}</strong></div></article><article><span><FaReceipt /></span><div><small>Pedidos pagados</small><strong>{summary.orders || 0}</strong></div></article><article><span><FaBagShopping /></span><div><small>Productos vendidos</small><strong>{summary.productsSold || 0}</strong></div></article><article><span><FaUsers /></span><div><small>Clientes únicos</small><strong>{summary.customers || 0}</strong></div></article><article><span><FaChartLine /></span><div><small>Ticket promedio</small><strong>{money(summary.averageTicket)}</strong></div></article></section>
      <section className="analytics-grid"><Ranking title="Productos más vendidos" subtitle="Ranking por unidades físicas vendidas." icon={FaBagShopping} items={data.topProducts || []} empty="No hay productos vendidos en este periodo." /><Ranking title="Promociones destacadas" subtitle="Descuentos y combos utilizados en pedidos pagados." icon={FaGift} items={data.topPromotions || []} empty="No hay ventas asociadas a promociones en este periodo." /></section>
      <section className="admin-panel-card analytics-status"><div className="admin-panel-card__toolbar"><div><h2>Distribución de pedidos</h2><p>Situación actual de las compras pagadas durante el mes.</p></div><span className="admin-panel-icon"><FaReceipt /></span></div><div className="analytics-status__body">{Object.entries(data.ordersByStatus || {}).map(([status, count]) => <article key={status}><header><span>{statusLabels[status] || status}</span><strong>{count}</strong></header><div><i style={{ width: `${count / totalStatus * 100}%` }} /></div></article>)}</div></section>
    </>}
  </AdminLayout>;
}
