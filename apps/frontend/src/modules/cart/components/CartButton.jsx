import { useEffect, useState } from "react";
import { FaCartShopping } from "react-icons/fa6";
import { getCart } from "../application/cartService";

export default function CartButton({ toggleCart }) {
  const [count, setCount] = useState(() => getCart().reduce((total, item) => total + (item.quantity || 1), 0));
  useEffect(() => {
    const updateCount = () => setCount(getCart().reduce((total, item) => total + (item.quantity || 1), 0));
    window.addEventListener("elpoblano:cart-updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => { window.removeEventListener("elpoblano:cart-updated", updateCount); window.removeEventListener("storage", updateCount); };
  }, []);
  return <button type="button" className="home-cart-button" onClick={() => toggleCart(true)} aria-label={`Abrir carrito, ${count} productos`}><FaCartShopping aria-hidden="true" />{count > 0 && <span>{count > 99 ? "99+" : count}</span>}</button>;
}
