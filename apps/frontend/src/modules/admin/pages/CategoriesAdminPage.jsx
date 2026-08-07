import { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { createCategory, listAdminCategories, updateCategory } from "../infrastructure/adminApi";

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const loadCategories = async () => {
    const result = await listAdminCategories();
    setCategories(result);
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialCategories = async () => {
      try {
        const result = await listAdminCategories();
        if (!cancelled) setCategories(result);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      }
    };

    loadInitialCategories();
    return () => { cancelled = true; };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await createCategory(name);
      setName("");
      await loadCategories();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const toggle = async (category) => {
    setError("");
    try {
      await updateCategory(category.id, { activo: !category.activo });
      await loadCategories();
    } catch (toggleError) {
      setError(toggleError.message);
    }
  };

  return (
    <div className="d-flex">
      <AdminSidebar />
      <main className="container py-4">
        <h1>Categorías</h1>
        <p>Solo el administrador principal puede crear o habilitar categorías.</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit} className="d-flex gap-2 mb-4">
          <input
            required
            minLength="2"
            maxLength="100"
            className="form-control"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nueva categoría"
          />
          <button className="btn btn-primary">Agregar</button>
        </form>
        <table className="table">
          <thead><tr><th>Nombre</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.nombre}</td>
                <td>{category.activo ? "Activa" : "Inactiva"}</td>
                <td>
                  <button
                    type="button"
                    className={`btn btn-sm ${category.activo ? "btn-outline-danger" : "btn-outline-success"}`}
                    onClick={() => toggle(category)}
                  >
                    {category.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
