import { useEffect, useState } from "react";
import { FaCloudArrowUp, FaFloppyDisk, FaImage } from "react-icons/fa6";
import { listCategories } from "../infrastructure/adminApi";

export default function ProductForm({ values, onChange, onImageChange, onSubmit, isSubmitting = false, submitStatus = "" }) {
  const [categories, setCategories] = useState([]);
  useEffect(() => { listCategories().then(setCategories).catch(() => setCategories([])); }, []);

  return (
    <form className="admin-form-card" onSubmit={onSubmit}>
      <div className="admin-form-card__section-title"><span>Información básica</span><p>Datos que verá el cliente en la carta.</p></div>
      <div className="admin-form-grid">
        <label className="admin-field admin-field--full">Nombre del producto<input required type="text" name="nombre" value={values.nombre || ""} onChange={onChange} placeholder="Ej. Tacos al pastor" /></label>
        <label className="admin-field admin-field--full">Descripción<textarea required name="descripcion" value={values.descripcion || ""} onChange={onChange} rows="4" placeholder="Describe ingredientes, presentación y sabor" /></label>
        <label className="admin-field">Categoría<select name="categoriaId" value={values.categoriaId || ""} onChange={onChange} required><option value="">Selecciona una categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></label>
        <label className="admin-field">Precio (S/)<input required type="number" min="0" step="0.01" name="precio" value={values.precio ?? ""} onChange={onChange} placeholder="0.00" /></label>
        <label className="admin-field">Stock disponible<input required type="number" min="0" name="stock" value={values.stock ?? 0} onChange={onChange} /></label>
        <label className="admin-switch"><input aria-label="Disponible para la venta" type="checkbox" name="activo" checked={values.activo ?? true} onChange={onChange} /><span aria-hidden="true" /><div><strong>Disponible para la venta</strong><small>Visible cuando tenga stock.</small></div></label>
      </div>

      <div className="admin-form-card__section-title"><span>Imagen del producto</span><p>Formatos JPG, PNG o WebP.</p></div>
      <label className="admin-file-field">
        <span>{values.imagen && typeof values.imagen === "string" ? <img src={values.imagen} alt="Vista actual del producto" /> : <FaImage aria-hidden="true" />}</span>
        <div><strong><FaCloudArrowUp aria-hidden="true" /> Seleccionar imagen</strong><small>La imagen se optimizará antes de subirla.</small></div>
        <input aria-label="Seleccionar imagen del producto" type="file" accept="image/jpeg,image/png,image/webp" onChange={onImageChange} disabled={isSubmitting} />
      </label>

      <div className="admin-form-actions">
        <button type="submit" className="admin-primary-action" disabled={isSubmitting}><FaFloppyDisk aria-hidden="true" /> {isSubmitting ? "Procesando..." : "Guardar producto"}</button>
        {submitStatus && <p role="status" aria-live="polite">{submitStatus}</p>}
      </div>
    </form>
  );
}
