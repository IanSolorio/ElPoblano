/* eslint-disable react/prop-types */
import React from "react";
import { FaHome, FaUserGraduate, FaSignOutAlt } from "react-icons/fa";
import "../css/SidebarAdmin.css";
import { Link} from "react-router-dom";
import { MdFastfood, MdLocalPizza, MdRestaurant } from "react-icons/md";

const SidebarAdmin = () => {
  return (
    <div
      className="sidebar text-white d-flex flex-column"
      style={{ width: "250px", height: "100vh" }}
    >
      {/* Perfil del usuario */}
      <div className="text-center py-4">
        <img
          src="src/assets/image/omen.jpg"
          alt="Admin"
          className="rounded-circle mb-2"
          style={{ width: "80px", height: "80px" }}
        />
        <h5 className="mb-0">Ian Solorio</h5>
        <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
          Admin
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
        <Link className="btn btn-outline-light logout-btn" to="/">
          <FaSignOutAlt className="me-2" />
          Logout
        </Link>
      </div>
    </div>
  );
};

export default SidebarAdmin;
