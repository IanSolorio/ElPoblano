import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faTiktok, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { FaEnvelope, FaLocationDot, FaPhone } from "react-icons/fa6";
import logo from "../../assets/image/LogoSinFondo.png";
import "../../css/Principal.css";

export default function Footer() {
  return (
    <footer className="home-footer">
      <div className="container">
        <div className="home-footer__grid">
          <div className="home-footer__brand">
            <Link to="/"><img src={logo} alt="" /><span>El Poblano</span></Link>
            <p>Auténtica inspiración mexicana preparada para compartir buenos momentos.</p>
            <div className="home-footer__social" aria-label="Redes sociales">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FontAwesomeIcon icon={faFacebook} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} /></a>
              <a href="https://www.tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok"><FontAwesomeIcon icon={faTiktok} /></a>
              <a href="https://wa.me/51998123456" target="_blank" rel="noreferrer" aria-label="WhatsApp"><FontAwesomeIcon icon={faWhatsapp} /></a>
            </div>
          </div>

          <div>
            <h2>Explora</h2>
            <ul>
              <li><Link to="/productos">Nuestros productos</Link></li>
              <li><Link to="/nosotros">Sobre nosotros</Link></li>
              <li><Link to="/ubicanos">Cómo llegar</Link></li>
              <li><Link to="/contact">Contáctanos</Link></li>
            </ul>
          </div>

          <div>
            <h2>Encuéntranos</h2>
            <ul className="home-footer__contact">
              <li><FaLocationDot aria-hidden="true" /><span>Puerto Maldonado, Perú</span></li>
              <li><FaPhone aria-hidden="true" /><span>+51 998 123 456</span></li>
              <li><FaEnvelope aria-hidden="true" /><span>contacto@elpoblano.com</span></li>
            </ul>
          </div>

          <div className="home-footer__hours">
            <h2>Horario</h2>
            <p><span>Lunes a sábado</span><strong>11:00 – 22:00</strong></p>
            <p><span>Domingo</span><strong>12:00 – 21:00</strong></p>
          </div>
        </div>
        <div className="home-footer__bottom">
          <span>© {new Date().getFullYear()} El Poblano</span>
          <span>Proyecto académico de demostración</span>
        </div>
      </div>
    </footer>
  );
}
