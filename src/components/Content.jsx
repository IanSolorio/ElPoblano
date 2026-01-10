import React from "react";
import img from "../assets/image/409395599_320815934213044_2490934735527099993_n.jpg";
import "../css/Principal.css";

const Content = () => {
  return (
    <div className="additional-section">
      <div className="top-section d-flex align-items-center justify-content-center">
        <div className="row w-100">
          <div className="col-md-6 d-flex justify-content-center align-items-center flex-column">
            <h2 style={{ color: "#8B0000", marginBottom: "20px" }}>
              ¡Descubre la Experiencia El Poblano!
            </h2>
            <div className="content-box">
              <h3>Lo Que Nuestros Clientes Dicen</h3>
              <p>
                En El Poblano, no solo servimos tacos, servimos momentos
                inolvidables. Cada cliente que nos visita es parte de nuestra
                familia, y nos esforzamos por ofrecer no solo comida deliciosa,
                sino también un ambiente acogedor y auténtico.
              </p>
            </div>
          </div>
          <div className="col-md-6 d-flex justify-content-center">
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/5xOkgestNIM"
              title="Video de tacos promocional"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "225px",
                borderRadius: "10px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            ></iframe>
          </div>
        </div>
      </div>

      <div className="bottom-section row align-items-center">
        <div className="col-md-6 text-center">
          <img
            src={img}
            alt="Promoción de temporada"
            className="img-fluid"
            style={{
              maxWidth: "350px",
              maxHeight: "350px",
              borderRadius: "10px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          />
        </div>
        <div className="col-md-6 text-center text-md-start">
          <div className="content-box">
            <h3 style={{ color: "#8B0000" }}>
              Aprovecha Nuestras Ofertas Por Temporada
            </h3>
            <p>
              En El Poblano, queremos que disfrutes de nuestros auténticos
              sabores mexicanos al mejor precio. Descubre promociones especiales
              en tacos al pastor, combos irresistibles y más. ¡No dejes pasar la
              oportunidad de disfrutar lo mejor de México mientras ahorras!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;
