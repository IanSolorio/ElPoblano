import { NavLink } from "react-router-dom";
import { FaArrowRightFromBracket, FaBoxesStacked, FaLayerGroup, FaTag, FaUserGroup, FaUserShield, FaUtensils } from "react-icons/fa6";
import logo from "../../../assets/image/LogoSinFondo.png";
import { useAuth } from "../../auth/application/AuthContext";
import "../../../css/SidebarAdmin.css";

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const displayName = user?.firstName || user?.nombre || "Administrador";
  const roleLabel = user?.role === "SUPER_ADMIN" ? "Administrador principal" : "Administrador";

  const links = [
    { to: "/admin", label: "Productos", icon: FaBoxesStacked, end: true },
    { to: "/crearproducto", label: "Nuevo producto", icon: FaUtensils },
    { to: "/admin/promociones", label: "Promociones", icon: FaTag },
    { to: "/admin/usuarios", label: "Usuarios", icon: FaUserGroup },
    ...(user?.role === "SUPER_ADMIN" ? [{ to: "/admin/categorias", label: "Categorías", icon: FaLayerGroup }] : []),
  ];

  return (
    <aside className="admin-sidebar">
      <NavLink className="admin-sidebar__brand" to="/">
        <img src={logo} alt="" />
        <span><strong>El Poblano</strong><small>Panel administrativo</small></span>
      </NavLink>

      <div className="admin-sidebar__profile">
        <div className="admin-sidebar__avatar">
          <FaUserShield aria-label="Perfil administrativo" />
          <i aria-hidden="true" />
        </div>
        <div><strong>{displayName}</strong><span>{roleLabel}</span></div>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Navegación administrativa">
        <span className="admin-sidebar__section-label">Gestión</span>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink className={({ isActive }) => `admin-sidebar__link${isActive ? " active" : ""}`} to={to} end={end} key={to}>
            <Icon aria-hidden="true" /><span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <span>Sistema en línea <i aria-hidden="true" /></span>
        <NavLink to="/" onClick={() => logout().catch(() => undefined)}>
          <FaArrowRightFromBracket aria-hidden="true" /> Cerrar sesión
        </NavLink>
      </div>
    </aside>
  );
}
