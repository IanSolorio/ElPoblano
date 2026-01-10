import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faTiktok, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import "../css/Principal.css";

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#4A1F1F', color: '#fff', padding: '20px 0' }}>
      <div className="container">
        <div className="row text-center text-md-start">
          <div className="col-md-4 mb-3">
            <h5 className="text-uppercase fw-bold">El Poblano</h5>
            <p>
              Tacos al pastor, comida auténtica y un ambiente acogedor para compartir con familia y
              amigos.
            </p>
          </div>

          <div className="col-md-4 mb-3">
            <h5 className="text-uppercase fw-bold">Enlaces Rápidos</h5>
            <ul className="list-unstyled">
              <li>
                <a href="/" style={{ color: '#fff', textDecoration: 'none' }}>Inicio</a>
              </li>
              <li>
                <a href="/productos" style={{ color: '#fff', textDecoration: 'none' }}>Productos</a>
              </li>
              <li>
                <a href="/nosotros" style={{ color: '#fff', textDecoration: 'none' }}>Nosotros</a>
              </li>
              <li>
                <a href="/contact" style={{ color: '#fff', textDecoration: 'none' }}>Contáctanos</a>
              </li>
            </ul>
          </div>

          <div className="col-md-4 mb-3">
            <h5 className="text-uppercase fw-bold">Contáctanos</h5>
            <p>
              <i className="fas fa-map-marker-alt"></i> Puerto Maldonado, Perú
            </p>
            <p>
              <i className="fas fa-phone"></i> +51 998 123 4567
            </p>
            <p>
              <i className="fas fa-envelope"></i> contacto@elpoblano.com
            </p>
          </div>
        </div>

        <hr style={{ backgroundColor: '#fff' }} />

        {/* Redes Sociales */}
        <div className="text-center mb-3">
          <h5 className="text-uppercase fw-bold">Síguenos en nuestras redes</h5>
          <div>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', margin: '0 10px' }}>
              <FontAwesomeIcon icon={faFacebook} size="2x" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', margin: '0 10px' }}>
              <FontAwesomeIcon icon={faTwitter} size="2x" />
            </a>
            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', margin: '0 10px' }}>
              <FontAwesomeIcon icon={faTiktok} size="2x" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', margin: '0 10px' }}>
              <FontAwesomeIcon icon={faInstagram} size="2x" />
            </a>
            <a href="https://wa.me/529981234567" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', margin: '0 10px' }}>
              <FontAwesomeIcon icon={faWhatsapp} size="2x" />
            </a>
          </div>
        </div>

        <div className="text-center">
          <p className="mb-0">&copy; {new Date().getFullYear()} El Poblano. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
