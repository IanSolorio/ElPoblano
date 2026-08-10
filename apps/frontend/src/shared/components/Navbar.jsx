import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FaUser } from "react-icons/fa6";
import logo from "../../assets/image/LogoSinFondo.png";
import LoginModal from "../../modules/admin/components/LoginModal";
import CartDrawer from "../../modules/cart/components/CartDrawer";
import CartButton from "../../modules/cart/components/CartButton";
import { useAuth } from "../../modules/auth/application/AuthContext";
import "../../css/Principal.css";

const links = [
  ["/", "Inicio"],
  ["/productos", "Productos"],
  ["/nosotros", "Nosotros"],
  ["/ubicanos", "Ubícanos"],
  ["/contact", "Contacto"],
];

export default function Navbar() {
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg home-navbar sticky-top">
      <div className="container">
        <Link className="home-navbar__brand" to="/" aria-label="El Poblano, inicio">
          <img src={logo} alt="" />
          <span><strong>El Poblano</strong><small>Taquería mexicana</small></span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Abrir navegación"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav mx-auto">
            {links.map(([to, label]) => (
              <li className="nav-item" key={to}>
                <NavLink
                  className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                  to={to}
                  end={to === "/"}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="home-navbar__actions">
            {user ? (
              <div className="home-user-menu">
                <span className="home-user-menu__greeting">Hola, <strong>{user.firstName}</strong></span>
                {user.role === "CUSTOMER" ? <><Link className="home-navbar__secondary" to="/mis-pedidos">Mis pedidos</Link><Link className="home-navbar__secondary" to="/historial">Historial</Link></> : <Link className="home-navbar__secondary" to="/admin">Administrar</Link>}
                <button type="button" className="home-navbar__login" onClick={logout}>Salir</button>
              </div>
            ) : (
              <button type="button" className="home-navbar__login" onClick={() => setOpenLoginModal(true)}>
                <FaUser aria-hidden="true" /> Iniciar sesión
              </button>
            )}
            <CartButton toggleCart={setIsCartOpen} />
          </div>
        </div>
      </div>

      <CartDrawer open={isCartOpen} toggleCart={setIsCartOpen} />
      <LoginModal open={openLoginModal} onClose={() => setOpenLoginModal(false)} />
    </nav>
  );
}
