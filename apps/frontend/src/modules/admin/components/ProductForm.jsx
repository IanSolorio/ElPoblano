import { useEffect, useState } from "react";
import { listCategories } from "../infrastructure/adminApi";
 
const FormProduct = ({ values, onChange, onImageChange, onSubmit, title, isSubmitting = false, submitStatus = "" }) => {
  const [categories, setCategories] = useState([]);
  useEffect(() => { listCategories().then(setCategories).catch(() => setCategories([])); }, []);
  return (
    <div className="container pt-4">
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <h2>{title}</h2>
          {/* Nombre del producto */}
          <label htmlFor="nombre">Nombre</label>
          <input
            type="text"
            className="form-control"
            id="nombre"
            placeholder="Ej. Tacos al pastor"
            name="nombre"
            value={values.nombre}
            onChange={onChange}
          />
        </div>
        {/* Descripción del producto */}
        <div className="mb-3">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            type="text"
            className="form-control"
            id="descripcion"
            placeholder="Ej. Deliciosos tacos con ingredientes frescos"
            name="descripcion"
            value={values.descripcion}
            onChange={onChange}
          />
        </div>
        {/* Categoría del producto */}
        <div className="mb-3">
          <label htmlFor="categoria">Categoría</label>
          <select
            className="form-control"
            id="categoria"
            name="categoriaId"
            value={values.categoriaId || ""}
            onChange={onChange}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
          </select>
        </div>
        {/* Precio del producto */}
        <div className="mb-3">
          <label htmlFor="precio">Precio</label>
          <input
            type="number"
            className="form-control"
            id="precio"
            placeholder="0.00"
            name="precio"
            value={values.precio}
            onChange={onChange}
          />
        </div>
        {/* Imagen del producto */}
        <div>
          <label className="form-label" htmlFor="imagen">
            Imagen
          </label>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="form-control" onChange={onImageChange} disabled={isSubmitting} />
        </div>
        <div className="mb-3 mt-3">
          <label htmlFor="stock">Stock disponible</label>
          <input type="number" min="0" className="form-control" id="stock" name="stock" value={values.stock ?? 0} onChange={onChange} />
        </div>
        <div className="form-check mt-3">
          <input type="checkbox" className="form-check-input" id="activo" name="activo" checked={values.activo ?? true} onChange={onChange} />
          <label className="form-check-label" htmlFor="activo">Disponible para la venta</label>
        </div>
        <button className="btn btn-primary btn-lg mt-3" disabled={isSubmitting}>
          {isSubmitting ? "Procesando..." : "Guardar"}
        </button>
        {submitStatus && <p className="mt-2" role="status" aria-live="polite">{submitStatus}</p>}
      </form>
    </div>
  );
};

export default FormProduct;
