import AdminSidebar from "../components/AdminSidebar";
import ProductListPage from "./ProductListPage";

function AdminPanel() {
  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="flex-grow-1 p-4">
        <ProductListPage />
      </div>
    </div>
  );
}

export default AdminPanel;
