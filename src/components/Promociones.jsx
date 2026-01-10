import React, { useEffect, useState } from "react";
import Marquee from "react-marquee-slider";
import "../css/Principal.css";
import { getProductos } from "../services/ProductoService";

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const productos = await getProductos();
        const promotionsData = productos
          .filter((producto) => producto.categoria === "Promociones")
          .map((producto) => ({
            id: producto.id,
            title: producto.nombre, 
            description: producto.descripcion, 
            image: producto.imagen, 
          }));
        setPromotions(promotionsData);
      } catch (error) {
        console.error("Error al cargar las promociones:", error);
      }
    };
    fetchPromotions();
  }, []);

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4" style={{ color: "#8B0000" }}>
        Nuestras Promociones
      </h2>
      {promotions.length > 0 ? (
        <Marquee velocity={20} minScale={0.7} resetAfterTries={200}>
          {promotions.map((promo) => (
            <div
              className="card shadow-sm"
              style={{
                width: "300px",
                margin: "0 10px",
              }}
              key={promo.id}
            >
              <img
                src={promo.image}
                className="card-img-top"
                alt={promo.title}
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h5 className="card-title">{promo.title}</h5>
                <p className="card-text">{promo.description}</p>
              </div>
            </div>
          ))}
        </Marquee>
      ) : (
        <p className="text-center">No hay promociones disponibles.</p>
      )}
    </div>
  );
};

export default Promotions;
