import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faTwitter,
  faTiktok,
  faInstagram,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import logo from "../../assets/image/LogoSinFondo.png";
import LoginModal from "../../modules/admin/components/LoginModal";
import CartDrawer from "../../modules/cart/components/CartDrawer";
import CartButton from "../../modules/cart/components/CartButton";
import { useAuth } from "../../modules/auth/application/AuthContext";

const Navbar = () => {
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const { user, logout } = useAuth();

  const toggleCart = (state) => {
    setIsCartOpen(state);
  };
  
  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={logo}
            alt="Logo"
            style={{ width: "50px", height: "50px", marginRight: "10px" }}
          />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link fw-bold" to="/">
                HOME
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold" to="/productos">
                PRODUCTOS
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold" to="/nosotros">
                NOSOTROS
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold" to="/ubicanos">
                UBÍCANOS
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold" to="/contact">
                CONTACTANOS
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center me-3">
            <a
              href="https://www.facebook.com"
              className="text-dark mx-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faFacebook} size="lg" />
            </a>
            <a
              href="https://twitter.com"
              className="text-dark mx-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faTwitter} size="lg" />
            </a>
            <a
              href="https://www.tiktok.com"
              className="text-dark mx-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faTiktok} size="lg" />
            </a>
            <a
              href="https://www.instagram.com"
              className="text-dark mx-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faInstagram} size="lg" />
            </a>
            <a
              href="https://wa.me"
              className="text-dark mx-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faWhatsapp} size="lg" />
            </a>
          </div>

          {user ? <div className="d-flex align-items-center gap-2">
            {user.role === "CUSTOMER" && <Link className="btn btn-outline-dark" to="/historial">Mis compras</Link>}
            {user.role !== "CUSTOMER" && <Link className="btn btn-outline-dark" to="/admin">Administrar</Link>}
            <span className="small">Hola, {user.firstName}</span>
            <button className="btn btn-dark" onClick={logout}>Salir</button>
          </div> : <button
            className="btn btn-dark rounded-pill px-4"
            style={{ fontWeight: "bold" }}
            onClick={() => setOpenLoginModal(true)}
          >
            LOGIN
          </button>}
          <CartButton toggleCart={toggleCart} />
          <CartDrawer open={isCartOpen} toggleCart={toggleCart} />
        </div>
      </div>

      <LoginModal
        open={openLoginModal}
        onClose={() => setOpenLoginModal(false)}
      />
    </nav>
  );
};

export default Navbar;
