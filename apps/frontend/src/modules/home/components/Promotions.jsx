import React, { useEffect, useState } from "react";
import "../../../css/Principal.css";
import { listActivePromotions } from "../../promotions/application/promotionService";

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const data = await listActivePromotions();
        const promotionsData = data.flatMap((promotion) => promotion.products.map((product) => ({
          id: `${promotion.id}-${product.id}`,
          title: promotion.name,
          description: `${product.nombre}: S/.${product.precioPromocional.toFixed(2)}`,
          image: product.imagen,
        })));
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
        <div className="promotions-marquee" aria-label="Promociones activas">
          <div className="promotions-marquee__track">
          {[...promotions, ...promotions].map((promo, index) => (
            <div
              className="card shadow-sm promotions-marquee__card"
              key={`${promo.id}-${index}`}
              aria-hidden={index >= promotions.length}
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
          </div>
        </div>
      ) : (
        <p className="text-center">No hay promociones disponibles.</p>
      )}
    </div>
  );
};

export default Promotions;
