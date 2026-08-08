import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa6";
import AdminLayout from "../components/AdminLayout";
import ProductListPage from "./ProductListPage";

export default function AdminPage() {
  return (
    <AdminLayout
      eyebrow="Inventario"
      title="Gestión de productos"
      description="Controla la disponibilidad, precios y existencias de la carta."
      actions={<Link className="admin-primary-action" to="/crearproducto"><FaPlus aria-hidden="true" /> Nuevo producto</Link>}
    >
      <ProductListPage />
    </AdminLayout>
  );
}
