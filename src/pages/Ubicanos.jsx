import React from "react";
import "../css/Ubicanos.css";

const Ubicanos = () => {
  return (
    <div className="ubicanos-container">
      <h1 className="text-center mb-4">Ubícanos</h1>
      <p className="text-center mb-4">
        Encuentra nuestro restaurante en la siguiente ubicación:
      </p>
      <div className="map-card mx-auto">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4664.49366766259!2d-69.1887222!3d-12.592913599999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x917b4f001af062a9%3A0x17d38cb1f443ff9a!2sEL%20POBLANO!5e1!3m2!1ses-419!2spe!4v1734667014107!5m2!1ses-419!2spe"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
        <div className="map-actions">
          <button
            className="btn btn-primary"
            onClick={() =>
              window.open(
                "https://www.google.com/maps?q=EL+POBLANO+Puerto+Maldonado",
                "_blank"
              )
            }
          >
            Abrir en Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};

export default Ubicanos;
