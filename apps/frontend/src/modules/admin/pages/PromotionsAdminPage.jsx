import { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { listAdminProducts } from "../../catalog/application/productService";
import { createPromotion, listAdminPromotions, removePromotion } from "../infrastructure/adminApi";

export default function PromotionsAdminPage() {
  const [promotions, setPromotions] = useState([]); const [products, setProducts] = useState([]); const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", discountType: "PERCENTAGE", discountValue: 10, startsAt: "", endsAt: "", productIds: [] });
  const load = async () => { try { setPromotions(await listAdminPromotions()); setProducts(await listAdminProducts()); } catch (loadError) { setError(loadError.message); } };
  useEffect(() => { load(); }, []);
  const submit = async (event) => { event.preventDefault(); try { await createPromotion({ ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(), active: true }); setForm({ ...form, name: "", productIds: [] }); await load(); } catch (submitError) { setError(submitError.message); } };
  return <div className="d-flex"><AdminSidebar /><main className="container p-4"><h1>Promociones</h1>{error && <div className="alert alert-danger">{error}</div>}
    <form onSubmit={submit} className="card card-body mb-4"><input className="form-control mb-2" placeholder="Nombre" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
      <div className="row"><div className="col"><select className="form-select" value={form.discountType} onChange={(e)=>setForm({...form,discountType:e.target.value})}><option value="PERCENTAGE">Porcentaje</option><option value="FIXED_AMOUNT">Monto fijo</option></select></div><div className="col"><input className="form-control" type="number" min="0.01" step="0.01" value={form.discountValue} onChange={(e)=>setForm({...form,discountValue:Number(e.target.value)})} /></div></div>
      <div className="row mt-2"><div className="col"><input className="form-control" type="datetime-local" value={form.startsAt} onChange={(e)=>setForm({...form,startsAt:e.target.value})} required /></div><div className="col"><input className="form-control" type="datetime-local" value={form.endsAt} onChange={(e)=>setForm({...form,endsAt:e.target.value})} required /></div></div>
      <select multiple className="form-select mt-2" value={form.productIds} onChange={(e)=>setForm({...form,productIds:[...e.target.selectedOptions].map(o=>o.value)})}>{products.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select><button className="btn btn-primary mt-3">Crear promoción</button></form>
    <div className="list-group">{promotions.map(p=><div className="list-group-item d-flex justify-content-between" key={p.id}><span>{p.name} ({p.discountValue}{p.discountType==="PERCENTAGE"?"%":" soles"})</span><button className="btn btn-outline-danger btn-sm" onClick={async()=>{await removePromotion(p.id);await load();}}>Retirar</button></div>)}</div></main></div>;
}
