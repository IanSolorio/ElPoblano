import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCartPlus, FaTag } from "react-icons/fa6";
import Swal from "sweetalert2";
import "../../../css/Principal.css";
import { listActivePromotions } from "../../promotions/application/promotionService";
import { addCartItem } from "../../cart/application/cartService";

const toCards = (promotion) => promotion.kind === "BUNDLE" ? [{
  id: `bundle-${promotion.id}`, title: promotion.name, product: promotion.name,
  description: promotion.description || promotion.products.map((item) => `${item.quantity}× ${item.nombre}`).join(" + "),
  price: Number(promotion.bundlePrice), originalPrice: promotion.products.reduce((sum, item) => sum + Number(item.precio) * item.quantity, 0),
  image: promotion.imageUrl, stock: Math.min(...promotion.products.map((item) => Math.floor(item.stock / item.quantity))),
  promotionId: promotion.id, kind: "BUNDLE", components: promotion.products,
}] : promotion.products.map((product) => ({
  id: `${promotion.id}-${product.id}`, title: promotion.name, product: product.nombre,
  price: Number(product.precioPromocional), originalPrice: Number(product.precio), image: product.imagen,
  stock: product.stock, productId: product.id, promotionId: promotion.id, kind: "PRODUCT_DISCOUNT",
}));

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const carousel = useRef(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });

  useEffect(() => { listActivePromotions().then((data) => setPromotions(data.flatMap(toCards))).catch((error) => console.error("Error al cargar las promociones:", error)).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!promotions.length) return undefined;
    let frame;
    let previousTime;
    const animate = (time) => {
      const track = carousel.current;
      if (track) {
        if (previousTime !== undefined && !drag.current.active) track.scrollLeft += (time - previousTime) * 0.06;
        const duplicateStart = track.children[promotions.length] ? track.children[promotions.length].offsetLeft - track.children[0].offsetLeft : 0;
        if (duplicateStart && track.scrollLeft >= duplicateStart) track.scrollLeft -= duplicateStart;
      }
      previousTime = time;
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [promotions.length]);

  const goTo = (index) => {
    if (!promotions.length) return;
    const next = (index + promotions.length) % promotions.length;
    setCurrent(next);
    carousel.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };
  const startDrag = (event) => {
    const track = carousel.current;
    if (!track) return;
    drag.current = { active: true, moved: false, startX: event.clientX, startScroll: track.scrollLeft };
    track.setPointerCapture(event.pointerId);
    track.classList.add("is-dragging");
  };
  const moveDrag = (event) => {
    if (!drag.current.active || !carousel.current) return;
    const distance = event.clientX - drag.current.startX;
    if (Math.abs(distance) > 4) drag.current.moved = true;
    const boundary = carousel.current.children[promotions.length].offsetLeft - carousel.current.children[0].offsetLeft;
    const requested = drag.current.startScroll - distance;
    carousel.current.scrollLeft = boundary ? ((requested % boundary) + boundary) % boundary : requested;
  };
  const stopDrag = (event) => {
    const track = carousel.current;
    if (!track || !drag.current.active) return;
    drag.current.active = false;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    track.classList.remove("is-dragging");
    window.setTimeout(() => { drag.current.moved = false; }, 0);
  };
  const preventDraggedClick = (event) => { if (drag.current.moved) { event.preventDefault(); event.stopPropagation(); } };
  const syncCurrentSlide = (event) => {
    const slides = [...event.currentTarget.children];
    if (!slides.length) return;
    const closest = slides.reduce((best, slide, index) => {
      const distance = Math.abs(slide.offsetLeft - event.currentTarget.scrollLeft);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity });
    setCurrent(closest.index % promotions.length);
  };
  const addPromotionToCart = (promo) => {
    addCartItem({ id: promo.kind === "BUNDLE" ? `bundle:${promo.promotionId}` : promo.productId, promotionId: promo.promotionId, promotionKind: promo.kind, componentes: promo.components, nombre: promo.product, imagen: promo.image, precio: promo.price, precioOriginal: promo.originalPrice, stock: promo.stock, esPromocion: true, promocionNombre: promo.title });
    Swal.fire({ title: "¡Promoción agregada!", text: `${promo.product} se añadió al carrito.`, icon: "success", confirmButtonColor: "#a62b25", confirmButtonText: "Continuar" });
  };

  const renderCard = (promo, index) => {
    const duplicate = index >= promotions.length;
    const originalIndex = index % promotions.length;
    return <article className="home-promo-card" key={`${promo.id}-${index}`} onFocus={() => !duplicate && setCurrent(originalIndex)} aria-hidden={duplicate ? "true" : undefined}><div className="home-promo-card__image"><img src={promo.image} alt={duplicate ? "" : promo.product} /><span>{promo.kind === "BUNDLE" ? "Combo" : "Oferta activa"}</span></div><div className="home-promo-card__body"><p>{promo.title}</p><h3>{promo.product}</h3>{promo.description && <small>{promo.description}</small>}<div className="home-promo-card__purchase"><div><del>S/ {promo.originalPrice.toFixed(2)}</del><strong>S/ {promo.price.toFixed(2)}</strong></div><button tabIndex={duplicate ? -1 : 0} onClick={() => addPromotionToCart(promo)}><FaCartPlus /> Agregar</button></div></div></article>;
  };

  return <section className="home-promotions" aria-labelledby="promotions-title"><div className="container">
    <div className="home-section-heading home-section-heading--split"><div><span className="home-eyebrow"><FaTag /> Promociones vigentes</span><h2 id="promotions-title">Un antojo que también conviene</h2></div><div className="home-promotions__actions"><Link className="home-text-link" to="/productos">Ver toda la carta <FaArrowRight /></Link></div></div>
    {loading ? <div className="home-promotions__grid" aria-label="Cargando promociones">{[1, 2, 3].map((item) => <div className="home-promo-skeleton" key={item} />)}</div> : promotions.length > 0 ? <><div className="home-promotions__viewport"><div className="home-promotions__track" ref={carousel} onScroll={syncCurrentSlide} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} onClickCapture={preventDraggedClick}>{Array.from({ length: Math.max(promotions.length * 2, 8) }, (_, index) => promotions[index % promotions.length]).map(renderCard)}</div></div>{promotions.length > 1 && <div className="home-carousel-dots" aria-label="Seleccionar promoción">{promotions.map((promo, index) => <button className={index === current ? "active" : ""} onClick={() => goTo(index)} aria-label={`Ir a ${promo.product}`} key={`${promo.id}-${index}`} />)}</div>}</> : <div className="home-promotions__empty"><span><FaTag /></span><div><h3>Muy pronto habrá nuevas promociones</h3><p>Mientras tanto, conoce todos los sabores disponibles en nuestra carta.</p></div><Link className="home-button home-button--dark" to="/productos">Ver productos</Link></div>}
  </div></section>;
}
