import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaMagnifyingGlass, FaPen, FaTrash, FaTriangleExclamation } from "react-icons/fa6";

export default function ProductTable({ products, onDelete, loading }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const itemsPerPage = 8;
  const filtered = useMemo(() => products.filter((product) =>
    `${product.nombre} ${product.categoria}`.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const visible = filtered.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  useEffect(() => { if (page >= pages) setPage(pages - 1); }, [page, pages]);

  return (
    <section className="admin-panel-card">
      <div className="admin-panel-card__toolbar">
        <div><h2>Catálogo registrado</h2><p>Consulta y actualiza los productos existentes.</p></div>
        <label className="admin-search"><FaMagnifyingGlass /><input placeholder="Buscar producto..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></label>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Inventario</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6"><div className="admin-table-empty">Cargando inventario...</div></td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan="6"><div className="admin-table-empty">No se encontraron productos.</div></td></tr>
            ) : visible.map((product) => {
              const outOfStock = Number(product.stock) === 0;
              return (
                <tr key={product.id} className={outOfStock ? "admin-table__warning" : ""}>
                  <td><div className="admin-product-cell">
                    <div className="admin-product-cell__image">{product.imagen ? <img src={product.imagen} alt="" /> : <span>{product.nombre.charAt(0)}</span>}{outOfStock && <i><FaTriangleExclamation /></i>}</div>
                    <div><strong>{product.nombre}</strong><span>{product.descripcion}</span></div>
                  </div></td>
                  <td><span className="admin-category-pill">{product.categoria}</span></td>
                  <td><strong>S/ {Number(product.precio).toFixed(2)}</strong></td>
                  <td><span className={outOfStock ? "admin-stock admin-stock--empty" : "admin-stock"}>{outOfStock ? "Agotado" : `${product.stock} unidades`}</span></td>
                  <td><span className="admin-status"><i /> Disponible</span></td>
                  <td><div className="admin-row-actions"><Link to={`/editarproducto/${product.id}`} aria-label={`Editar ${product.nombre}`}><FaPen /></Link><button onClick={() => onDelete(product.id)} aria-label={`Retirar ${product.nombre}`}><FaTrash /></button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && <div className="admin-pagination"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {page + 1} de {pages}</span><button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Siguiente</button></div>}
    </section>
  );
}
