import { useEffect, useMemo, useState } from "react";
import { FaBoxOpen, FaCircleCheck, FaTriangleExclamation } from "react-icons/fa6";
import Swal from "sweetalert2";
import { deleteProduct, listAdminProducts } from "../../catalog/application/productService";
import ProductTable from "../components/ProductTable";

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAdminProducts()
      .then(setProducts)
      .catch(() => Swal.fire("Error", "No se pudieron cargar los productos", "error"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: products.length,
    available: products.filter((product) => Number(product.stock) > 0).length,
    empty: products.filter((product) => Number(product.stock) === 0).length,
  }), [products]);

  const handleDelete = async (id) => {
    const confirmation = await Swal.fire({
      title: "¿Retirar este producto?",
      text: "Dejará de estar disponible para la venta.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d65f3c",
      cancelButtonColor: "#285943",
      confirmButtonText: "Sí, retirar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await deleteProduct(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      Swal.fire("Producto retirado", "El cambio quedó registrado.", "success");
    } catch (error) {
      console.error("Error al retirar producto:", error);
      Swal.fire("Error", "No se pudo retirar el producto.", "error");
    }
  };

  return (
    <>
      <section className="admin-stats" aria-label="Resumen de inventario">
        <article><span className="admin-stat-icon admin-stat-icon--green"><FaBoxOpen /></span><div><small>Total de productos</small><strong>{stats.total}</strong></div></article>
        <article><span className="admin-stat-icon admin-stat-icon--mint"><FaCircleCheck /></span><div><small>Con disponibilidad</small><strong>{stats.available}</strong></div></article>
        <article><span className="admin-stat-icon admin-stat-icon--accent"><FaTriangleExclamation /></span><div><small>Sin existencias</small><strong>{stats.empty}</strong></div></article>
      </section>
      <ProductTable products={products} onDelete={handleDelete} loading={loading} />
    </>
  );
}
