import React from "react";
import Fondo from "../assets/image/fondo-papel-tapiz-vintage_53876-25249.jpg"; // Importar la imagen
import T1 from "../assets/image/tacos-8184634_1280.jpg"; // Importar la imagen
import "../css/Principal.css";

const Presentacion = () => {
  return (
    <div
      className="container-fluid py-5"
      style={{
        backgroundImage: `url(${Fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <h2 className="fw-bold">
              EL POBLANO<span className="text-danger"> RESTAURANT</span>
            </h2>
            <p className="text-muted">
              "En El Poblano, celebramos la auténtica cocina mexicana con
              sabores que conquistan. Cada plato es una fusión de tradición,
              ingredientes frescos y pasión. ¡Descubre México en cada bocado!"
            </p>
            <a
              href="#"
              className="btn btn-danger fw-bold px-4 py-2"
              style={{ borderRadius: "0px" }}
            >
              ORDER NOW
            </a>
          </div>

          {/* Columna Derecha */}
          <div className="col-md-6 d-flex justify-content-center position-relative">
            <img
              src={T1}
              alt="Promo"
              className="img-fluid"
              style={{ maxWidth: "350px", zIndex: "1" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Presentacion;
