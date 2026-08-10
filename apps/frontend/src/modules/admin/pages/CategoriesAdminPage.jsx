import { useEffect, useState } from "react";
import { FaLayerGroup, FaPlus } from "react-icons/fa6";
import AdminLayout from "../components/AdminLayout";
import { createCategory, listAdminCategories, updateCategory } from "../infrastructure/adminApi";

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const load = async () => setCategories(await listAdminCategories());
  useEffect(() => { load().catch((loadError) => setError(loadError.message)); }, []);
  const submit = async (event) => { event.preventDefault(); setError(""); try { await createCategory(name); setName(""); await load(); } catch (submitError) { setError(submitError.message); } };
  const toggle = async (category) => { setError(""); try { await updateCategory(category.id, { activo: !category.activo }); await load(); } catch (toggleError) { setError(toggleError.message); } };

  return (
    <AdminLayout eyebrow="Configuración" title="Categorías" description="Organiza la carta y controla qué grupos están disponibles.">
      {error && <div className="admin-alert">{error}</div>}
      <section className="admin-split-layout">
        <form className="admin-compact-form" onSubmit={submit}>
          <span className="admin-compact-form__icon"><FaLayerGroup /></span><h2>Nueva categoría</h2><p>Crea una clasificación para los productos.</p>
          <label className="admin-field">Nombre<input required minLength="2" maxLength="100" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Postres" /></label>
          <button type="submit" className="admin-primary-action"><FaPlus /> Agregar categoría</button>
        </form>
        <section className="admin-panel-card">
          <div className="admin-panel-card__toolbar"><div><h2>Categorías registradas</h2><p>Solo el administrador principal puede modificarlas.</p></div></div>
          <div className="admin-list">{categories.map((category) => <article key={category.id}><span className="admin-list__letter">{category.nombre.charAt(0)}</span><div><strong>{category.nombre}</strong><small>{category.activo ? "Visible en la carta" : "Categoría oculta"}</small></div><span className={category.activo ? "admin-status" : "admin-status admin-status--off"}><i /> {category.activo ? "Activa" : "Inactiva"}</span><button type="button" className="admin-outline-action" onClick={() => toggle(category)}>{category.activo ? "Desactivar" : "Activar"}</button></article>)}</div>
        </section>
      </section>
    </AdminLayout>
  );
}
