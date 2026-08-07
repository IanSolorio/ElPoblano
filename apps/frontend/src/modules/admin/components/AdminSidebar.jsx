import React from "react";
import { FaSignOutAlt } from "react-icons/fa";
import "../../../css/SidebarAdmin.css";
import { Link} from "react-router-dom";
import { MdFastfood, MdRestaurant } from "react-icons/md";
import adminAvatar from "../../../assets/image/omen.jpg";
import { useAuth } from "../../auth/application/AuthContext";

const SidebarAdmin = () => {
  const { user, logout } = useAuth();
  return (
    <div
      className="sidebar text-white d-flex flex-column"
      style={{ width: "250px", height: "100vh" }}
    >
      {/* Perfil del usuario */}
      <div className="text-center py-4">
        <img
          src={adminAvatar}
          alt="Admin"
          className="rounded-circle mb-2"
          style={{ width: "80px", height: "80px" }}
        />
        <h5 className="mb-0">{user?.nombre || "Administrador"}</h5>
        <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
          {user?.role === "SUPER_ADMIN" ? "Administrador principal" : "Administrador"}
        </p>
      </div>

      {/* Menú */}
      <nav className="nav flex-column py-3">
        <Link
          to="/admin"
          className="nav-link text-white d-flex align-items-center mb-2"
        >
          <MdRestaurant className="me-2" />
          <span>Producto</span>
        </Link>
        <Link to="/admin/promociones" className="nav-link text-white d-flex align-items-center mb-2"><span>Promociones</span></Link>
        <Link to="/admin/usuarios" className="nav-link text-white d-flex align-items-center mb-2"><span>Usuarios</span></Link>
        {user?.role === "SUPER_ADMIN" && <Link to="/admin/categorias" className="nav-link text-white d-flex align-items-center mb-2"><span>Categorías</span></Link>}
        <Link
          to="/crearproducto"
          className="nav-link text-white d-flex align-items-center mb-2"
        >
          <MdFastfood className="me-2" />
          <span>Crear Producto</span>
        </Link>
      </nav>

      {/* Logout */}
      <div className="mt-auto text-center py-3 d-flex justify-content-center">
        <Link className="btn btn-outline-light logout-btn" to="/" onClick={() => logout().catch(() => undefined)}>
          <FaSignOutAlt className="me-2" />
          Logout
        </Link>
      </div>
    </div>
  );
};

export default SidebarAdmin;
