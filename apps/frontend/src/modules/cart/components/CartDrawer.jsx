import { useEffect, useMemo, useState } from "react";
import { Drawer } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaBagShopping, FaMinus, FaPlus, FaShieldHalved, FaTag, FaTrash, FaXmark } from "react-icons/fa6";
import { getCart, getCartTotal, removeCartItem, updateCartItemQuantity } from "../application/cartService";
import { useAuth } from "../../auth/application/AuthContext";
import "../../../css/Carrito.css";

export default function CartDrawer({ open, toggleCart }) {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const refresh = () => setItems(getCart());

  useEffect(() => {
    if (open) refresh();
    window.addEventListener("elpoblano:cart-updated", refresh);
    return () => window.removeEventListener("elpoblano:cart-updated", refresh);
  }, [open]);

  const total = useMemo(() => getCartTotal(items), [items]);
  const units = useMemo(() => items.reduce((sum, item) => sum + (item.quantity || 1), 0), [items]);

  const updateQuantity = (item, amount) => {
    const next = (item.quantity || 1) + amount;
    if (next <= 0) removeCartItem(item.id);
    else updateCartItemQuantity(item.id, next);
  };

  const checkout = () => {
    toggleCart(false);
    navigate(user ? "/checkout" : "/registro");
  };

  return (
    <Drawer anchor="right" open={open} onClose={() => toggleCart(false)} classes={{ paper: "cart-drawer" }}>
      <div className="cart-drawer__header">
        <div><span><FaBagShopping aria-hidden="true" /></span><div><h2>Tu pedido</h2><p>{units} {units === 1 ? "producto" : "productos"}</p></div></div>
        <button type="button" onClick={() => toggleCart(false)} aria-label="Cerrar carrito"><FaXmark /></button>
      </div>

      <div className="cart-drawer__body">
        {items.length === 0 ? (
          <div className="cart-empty"><span><FaBagShopping /></span><h3>Tu carrito está esperando</h3><p>Explora nuestra carta y agrega tus sabores favoritos.</p><button type="button" onClick={() => { toggleCart(false); navigate("/productos"); }}>Ver productos <FaArrowRight /></button></div>
        ) : items.map((item) => (
          <article className="cart-item" key={item.id}>
            <div className="cart-item__image">{item.imagen ? <img src={item.imagen} alt={item.nombre} /> : <FaBagShopping />}{item.esPromocion && <span><FaTag /> Promo</span>}</div>
            <div className="cart-item__content">
              <div className="cart-item__top"><div>{item.esPromocion && <small>{item.promocionNombre}</small>}<h3>{item.nombre}</h3></div><button type="button" onClick={() => removeCartItem(item.id)} aria-label={`Eliminar ${item.nombre}`}><FaTrash /></button></div>
              {item.promotionKind === "BUNDLE" && <p className="cart-item__components">{item.componentes?.map((component) => `${component.quantity}× ${component.nombre}`).join(" + ")}</p>}
              <div className="cart-item__bottom">
                <div className="cart-quantity"><button type="button" onClick={() => updateQuantity(item, -1)} aria-label="Reducir cantidad"><FaMinus /></button><span>{item.quantity || 1}</span><button type="button" disabled={Number(item.stock) > 0 && item.quantity >= item.stock} onClick={() => updateQuantity(item, 1)} aria-label="Aumentar cantidad"><FaPlus /></button></div>
                <div className="cart-item__price">{item.precioOriginal && Number(item.precioOriginal) > Number(item.precio) && <del>S/ {Number(item.precioOriginal).toFixed(2)}</del>}<strong>S/ {(Number(item.precio) * (item.quantity || 1)).toFixed(2)}</strong></div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {items.length > 0 && <footer className="cart-drawer__footer">
        <div className="cart-summary"><span>Subtotal</span><strong>S/ {total.toFixed(2)}</strong><span>Envío</span><b>Por confirmar</b></div>
        <div className="cart-total"><span>Total estimado</span><strong>S/ {total.toFixed(2)}</strong></div>
        <button type="button" className="cart-checkout" onClick={checkout}>{user ? "Continuar al pago" : "Regístrate para comprar"}<FaArrowRight /></button>
        <p><FaShieldHalved /> Pago procesado de forma segura</p>
      </footer>}
    </Drawer>
  );
}
