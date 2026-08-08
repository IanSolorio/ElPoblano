import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCartPlus, FaTag } from "react-icons/fa6";
import Swal from "sweetalert2";
import "../../../css/Principal.css";
import { listActivePromotions } from "../../promotions/application/promotionService";
import { addCartItem } from "../../cart/application/cartService";

const toCards = (promotion) => {
  if (promotion.kind === "BUNDLE") return [{
    id: `bundle-${promotion.id}`, title: promotion.name, product: promotion.name,
    description: promotion.description || promotion.products.map((item) => `${item.quantity}× ${item.nombre}`).join(" + "),
    price: Number(promotion.bundlePrice), originalPrice: promotion.products.reduce((sum, item) => sum + Number(item.precio) * item.quantity, 0),
    image: promotion.imageUrl, stock: Math.min(...promotion.products.map((item) => Math.floor(item.stock / item.quantity))),
    promotionId: promotion.id, kind: "BUNDLE", components: promotion.products,
  }];
  return promotion.products.map((product) => ({
    id: `${promotion.id}-${product.id}`, title: promotion.name, product: product.nombre,
    price: Number(product.precioPromocional), originalPrice: Number(product.precio), image: product.imagen,
    stock: product.stock, productId: product.id, promotionId: promotion.id, kind: "PRODUCT_DISCOUNT",
  }));
};

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    listActivePromotions().then((data) => setPromotions(data.flatMap(toCards))).catch((error) => console.error("Error al cargar las promociones:", error)).finally(() => setLoading(false));
  }, []);

  const addPromotionToCart = (promo) => {
    addCartItem({
      id: promo.kind === "BUNDLE" ? `bundle:${promo.promotionId}` : promo.productId,
      promotionId: promo.promotionId, promotionKind: promo.kind, componentes: promo.components,
      nombre: promo.product, imagen: promo.image, precio: promo.price, precioOriginal: promo.originalPrice,
      stock: promo.stock, esPromocion: true, promocionNombre: promo.title,
    });
    Swal.fire({ title: "¡Promoción agregada!", text: `${promo.product} se añadió al carrito.`, icon: "success", confirmButtonColor: "#a62b25", confirmButtonText: "Continuar" });
  };

  return <section className="home-promotions" aria-labelledby="promotions-title"><div className="container">
    <div className="home-section-heading home-section-heading--split"><div><span className="home-eyebrow"><FaTag /> Promociones vigentes</span><h2 id="promotions-title">Un antojo que también conviene</h2></div><Link className="home-text-link" to="/productos">Ver toda la carta <FaArrowRight /></Link></div>
    {loading ? <div className="home-promotions__grid" aria-label="Cargando promociones">{[1, 2, 3].map((item) => <div className="home-promo-skeleton" key={item} />)}</div> : promotions.length > 0 ?
      <div className="home-promotions__grid">{promotions.slice(0, 6).map((promo) => <article className="home-promo-card" key={promo.id}><div className="home-promo-card__image"><img src={promo.image} alt={promo.product} /><span>{promo.kind === "BUNDLE" ? "Combo" : "Oferta activa"}</span></div><div className="home-promo-card__body"><p>{promo.title}</p><h3>{promo.product}</h3>{promo.description && <small>{promo.description}</small>}<div className="home-promo-card__purchase"><div><del>S/ {promo.originalPrice.toFixed(2)}</del><strong>S/ {promo.price.toFixed(2)}</strong></div><button onClick={() => addPromotionToCart(promo)}><FaCartPlus /> Agregar</button></div></div></article>)}</div> :
      <div className="home-promotions__empty"><span><FaTag /></span><div><h3>Muy pronto habrá nuevas promociones</h3><p>Mientras tanto, conoce todos los sabores disponibles en nuestra carta.</p></div><Link className="home-button home-button--dark" to="/productos">Ver productos</Link></div>}
  </div></section>;
}
