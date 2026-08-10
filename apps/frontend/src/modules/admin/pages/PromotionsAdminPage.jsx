import { useEffect, useRef, useState } from "react";
import { FaCalendarDays, FaGift, FaPlus, FaTag, FaTrash } from "react-icons/fa6";
import AdminLayout from "../components/AdminLayout";
import { listAdminProducts } from "../../catalog/application/productService";
import { uploadFile } from "../../catalog/infrastructure/imageStorage";
import { createPromotion, listAdminPromotions, removePromotion } from "../infrastructure/adminApi";

const newForm = () => ({ name: "", description: "", kind: "PRODUCT_DISCOUNT", discountType: "PERCENTAGE", discountValue: "10", bundlePrice: "", startsAt: "", endsAt: "", products: [], image: null });

export default function PromotionsAdminPage() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(newForm);
  const fileInput = useRef(null);
  const load = async () => { const [promotionData, productData] = await Promise.all([listAdminPromotions(), listAdminProducts()]); setPromotions(promotionData); setProducts(productData); };
  useEffect(() => { load().catch((loadError) => setError(loadError.message)); }, []);

  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value ?? "" }));
  const changeKind = (event) => {
    if (fileInput.current) fileInput.current.value = "";
    setForm((current) => ({ ...current, kind: event.target.value, products: [], image: null }));
  };
  const toggleProduct = (productId) => setForm((current) => ({ ...current, products: current.products.some((item) => item.productId === productId) ? current.products.filter((item) => item.productId !== productId) : [...current.products, { productId, quantity: 1 }] }));
  const setQuantity = (productId, value) => setForm((current) => ({ ...current, products: current.products.map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, Number(value) || 1) } : item) }));

  const submit = async (event) => {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      let imageUrl;
      if (form.kind === "BUNDLE") imageUrl = await uploadFile(form.image, undefined, "promociones");
      await createPromotion({
        name: form.name, description: form.description || undefined, kind: form.kind,
        ...(form.kind === "BUNDLE" ? { bundlePrice: Number(form.bundlePrice), imageUrl } : { discountType: form.discountType, discountValue: Number(form.discountValue) }),
        startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(), active: true, products: form.products,
      });
      setForm(newForm());
      if (fileInput.current) fileInput.current.value = "";
      await load();
    } catch (submitError) { setError(submitError.message); } finally { setSaving(false); }
  };
  const remove = async (id) => { try { await removePromotion(id); await load(); } catch (removeError) { setError(removeError.message); } };
  const describeProducts = (items) => items.map((item) => {
    const quantity = item.quantity > 1 ? `${item.quantity}× ` : "";
    return `${quantity}${item.nombre}`;
  }).join(", ");
  const describeValue = (promotion) => {
    if (promotion.kind === "BUNDLE") return `S/ ${Number(promotion.bundlePrice).toFixed(2)}`;
    const unit = promotion.discountType === "PERCENTAGE" ? "%" : " soles";
    return `${promotion.discountValue}${unit}`;
  };

  return <AdminLayout eyebrow="Campañas" title="Promociones" description="Crea descuentos individuales o combos con precio e imagen propios.">
    {error && <div className="admin-alert" role="alert">{error}</div>}
    <section className="admin-promotion-layout">
      <form className="admin-form-card admin-promotion-form" onSubmit={submit}>
        <div className="admin-form-card__section-title"><span>Nueva promoción</span><p>Define la modalidad, vigencia y productos participantes.</p></div>
        <div className="admin-form-grid admin-promotion-form-grid">
          <label className="admin-field">Modalidad<select value={form.kind} onChange={changeKind}><option value="PRODUCT_DISCOUNT">Descuento por producto</option><option value="BUNDLE">Combo de productos</option></select></label>
          <label className="admin-field">Nombre<input value={form.name} onChange={change("name")} placeholder={form.kind === "BUNDLE" ? "Ej. Combo familiar" : "Ej. Semana del taco"} required /></label>
          <label className="admin-field admin-field--full">Descripción<textarea value={form.description} onChange={change("description")} maxLength="500" rows="3" placeholder="Explica brevemente qué incluye la promoción." /></label>
          {form.kind === "PRODUCT_DISCOUNT" ? <>
            <label className="admin-field">Tipo de descuento<select value={form.discountType} onChange={change("discountType")}><option value="PERCENTAGE">Porcentaje</option><option value="FIXED_AMOUNT">Monto fijo</option></select></label>
            <label className="admin-field">Valor<input type="number" min="0.01" step="0.01" value={form.discountValue} onChange={change("discountValue")} required /></label>
          </> : <>
            <label className="admin-field">Precio total del combo<input type="number" min="0.01" step="0.01" value={form.bundlePrice} onChange={change("bundlePrice")} placeholder="S/ 0.00" required /></label>
            <label className="admin-field admin-file-field">Imagen representativa<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setForm((current) => ({ ...current, image: event.target.files?.[0] || null }))} required /><small>JPG, PNG o WebP. Máximo 5 MB.</small></label>
          </>}
          <label className="admin-field">Inicio<input type="datetime-local" value={form.startsAt} onChange={change("startsAt")} required /></label>
          <label className="admin-field">Finalización<input type="datetime-local" value={form.endsAt} onChange={change("endsAt")} required /></label>
          <div className="admin-field admin-field--full"><span>Productos incluidos</span><small>{form.kind === "BUNDLE" ? "Selecciona al menos dos productos y define sus cantidades." : "Cada producto conservará su imagen original."}</small>
            <div className="admin-promotion-products">{products.map((product) => { const selected = form.products.find((item) => item.productId === product.id); return <label key={product.id} className={selected ? "is-selected" : ""}><input type="checkbox" checked={Boolean(selected)} onChange={() => toggleProduct(product.id)} /><span>{product.nombre}</span>{form.kind === "BUNDLE" && selected && <span className="admin-product-quantity"><small>Cantidad</small><input aria-label={`Cantidad de ${product.nombre}`} type="number" min="1" max="99" value={selected.quantity ?? 1} onChange={(event) => setQuantity(product.id, event.target.value)} /></span>}</label>; })}</div>
          </div>
        </div>
        <div className="admin-promotion-form__footer"><small>{form.products.length} producto(s) seleccionado(s)</small><button type="submit" className="admin-primary-action" disabled={saving || !form.products.length || (form.kind === "BUNDLE" && form.products.length < 2)}><FaPlus /> {saving ? "Guardando..." : "Crear promoción"}</button></div>
      </form>

      <section className="admin-panel-card">
        <div className="admin-panel-card__toolbar"><div><h2>Promociones programadas</h2><p>{promotions.length} campañas registradas.</p></div><span className="admin-panel-icon"><FaTag /></span></div>
        <div className="admin-promotion-list">{promotions.length === 0 ? <div className="admin-table-empty">No hay promociones registradas.</div> : promotions.map((promotion) => <article key={promotion.id}><span className="admin-promotion-list__icon">{promotion.kind === "BUNDLE" ? <FaGift /> : <FaTag />}</span><div><strong>{promotion.name}</strong><small><FaCalendarDays /> {new Date(promotion.startsAt).toLocaleDateString()} – {new Date(promotion.endsAt).toLocaleDateString()}</small><small>{describeProducts(promotion.products)}</small></div><b>{describeValue(promotion)}</b><button type="button" onClick={() => remove(promotion.id)} aria-label={`Retirar ${promotion.name}`}><FaTrash /></button></article>)}</div>
      </section>
    </section>
  </AdminLayout>;
}
