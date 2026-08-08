import { FaArrowUpRightFromSquare, FaClock, FaLocationDot, FaRoute } from "react-icons/fa6";
import "../../../css/Ubicanos.css";

const mapsUrl = "https://www.google.com/maps?q=EL+POBLANO+Puerto+Maldonado";

export default function LocationPage() {
  return (
    <main className="location-page">
      <header className="location-hero">
        <div className="container">
          <span className="location-eyebrow"><FaLocationDot aria-hidden="true" /> Ven a visitarnos</span>
          <h1>Estamos más cerca de tu próximo antojo</h1>
          <p>Encuentra El Poblano en Puerto Maldonado y disfruta nuestros sabores recién preparados.</p>
        </div>
      </header>

      <section className="container location-content">
        <div className="location-info">
          <article>
            <span><FaLocationDot aria-hidden="true" /></span>
            <div><small>Dirección</small><h2>Puerto Maldonado, Perú</h2><p>Consulta la ruta exacta desde tu ubicación.</p></div>
          </article>
          <article>
            <span><FaClock aria-hidden="true" /></span>
            <div><small>Horario</small><h2>Lunes a sábado</h2><p>11:00 a 22:00 · Domingo 12:00 a 21:00</p></div>
          </article>
          <article>
            <span><FaRoute aria-hidden="true" /></span>
            <div><small>Cómo llegar</small><h2>Abre tu ruta</h2><p>Google Maps te mostrará el mejor camino.</p></div>
          </article>
        </div>

        <div className="location-map-card">
          <div className="location-map-card__header">
            <div><span className="location-eyebrow">Mapa interactivo</span><h2>Traza tu camino hasta El Poblano</h2></div>
            <a href={mapsUrl} target="_blank" rel="noreferrer">Abrir en Maps <FaArrowUpRightFromSquare aria-hidden="true" /></a>
          </div>
          <div className="location-map-card__map">
            <iframe
              title="Ubicación de El Poblano en Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4664.49366766259!2d-69.1887222!3d-12.592913599999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x917b4f001af062a9%3A0x17d38cb1f443ff9a!2sEL%20POBLANO!5e1!3m2!1ses-419!2spe!4v1734667014107!5m2!1ses-419!2spe"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
