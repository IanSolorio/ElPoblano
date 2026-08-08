import { Link } from "react-router-dom";
import { FaArrowRight, FaClock, FaLocationDot, FaStar } from "react-icons/fa6";
import tacoHero from "../../../assets/image/tacos-8184634_1280.jpg";
import "../../../css/Principal.css";

export default function Hero() {
  return (
    <section className="home-hero">
      <div className="home-hero__texture" aria-hidden="true" />
      <div className="container home-hero__container">
        <div className="home-hero__content">
          <span className="home-eyebrow">
            <FaStar aria-hidden="true" /> Sabor mexicano en Puerto Maldonado
          </span>
          <h1>
            Tacos hechos con <em>tradición</em>, listos para ti.
          </h1>
          <p className="home-hero__lead">
            Ingredientes frescos, recetas con carácter y ese sabor que convierte
            cualquier comida en un buen momento.
          </p>
          <div className="home-hero__actions">
            <Link className="home-button home-button--primary" to="/productos">
              Ver nuestro menú <FaArrowRight aria-hidden="true" />
            </Link>
            <Link className="home-button home-button--ghost" to="/ubicanos">
              <FaLocationDot aria-hidden="true" /> Visítanos
            </Link>
          </div>
          <div className="home-hero__meta" aria-label="Información del servicio">
            <div>
              <FaClock aria-hidden="true" />
              <span><strong>Atención rápida</strong>Pedidos preparados al momento</span>
            </div>
            <div>
              <FaStar aria-hidden="true" />
              <span><strong>Recetas auténticas</strong>Sabor poblano en cada bocado</span>
            </div>
          </div>
        </div>

        <div className="home-hero__visual">
          <div className="home-hero__sun" aria-hidden="true" />
          <div className="home-hero__image-frame">
            <img src={tacoHero} alt="Tacos mexicanos preparados por El Poblano" />
          </div>
          <div className="home-hero__floating-card">
            <span>Preparado con</span>
            <strong>ingredientes frescos</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
