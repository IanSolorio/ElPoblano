import { useCallback, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/application/AuthContext";
import { clearCart, getCart, getCartTotal } from "../../cart/application/cartService";
import { createOrder } from "../infrastructure/orderApi";
import MercadoPagoPayment from "../../payments/components/MercadoPagoPayment";

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const cart = useMemo(() => getCart(), []);
  const [order, setOrder] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());
  if (loading) return <p className="container py-5">Cargando...</p>;
  if (!user) return <Navigate to="/registro" replace />;
  if (!cart.length) return <main className="container py-5"><h1>Tu carrito está vacío</h1><Link to="/productos">Ver productos</Link></main>;
  const address = user.addresses?.find((item) => item.isDefault) || user.addresses?.[0];
  const handlePaymentStatus = useCallback((status) => setSaving(Boolean(status)), []);
  const handlePaymentError = useCallback((message) => setError(message), []);
  const handleRejected = useCallback(() => { setOrder(null); idempotencyKey.current = crypto.randomUUID(); }, []);
  const handleApproved = useCallback((paidOrder) => {
    clearCart(); navigate(`/mis-pedidos?pedido=${paidOrder.id}`);
  }, [navigate]);

  const continueToPayment = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const createdOrder = await createOrder({ items: cart.map((item) => item.promotionKind === "BUNDLE" ? { promotionId: item.promotionId, quantity: item.quantity || 1 } : { productId: item.id, quantity: item.quantity || 1 }), paymentMethod: "CREDIT_CARD", addressId: address.id, phone: user.phone, notes }, idempotencyKey.current);
      setOrder(createdOrder);
    } catch (checkoutError) { setError(checkoutError.message); setSaving(false); }
  };

  return <main className="container py-5" style={{ maxWidth: 800 }}>
    <h1>Confirmar compra</h1>{error && <div className="alert alert-danger">{error}</div>}
    <section className="card p-3 mb-3"><h2 className="h5">Entrega</h2><strong>{address?.label}</strong><span>{address?.addressLine}</span><small>{address?.reference}</small></section>
    <section className="card p-3 mb-3"><h2 className="h5">Productos</h2>{cart.map((item) => <div key={item.id} className="d-flex justify-content-between"><span>{item.quantity || 1} × {item.nombre}</span><span>S/ {(Number(item.precio) * (item.quantity || 1)).toFixed(2)}</span></div>)}<hr/><strong>Total: S/ {getCartTotal(cart).toFixed(2)}</strong></section>
    {!order ? <form onSubmit={continueToPayment} className="card p-3"><h2 className="h5">Pago seguro</h2>
      <div className="alert alert-info">En el siguiente paso Mercado Pago mostrará los medios de prueba disponibles. ElPoblano no recibe ni almacena los datos de tu tarjeta.</div>
      <label className="form-label">Indicaciones</label><textarea className="form-control" maxLength="1000" value={notes} onChange={(event) => setNotes(event.target.value)} />
      <button disabled={saving || !address} className="btn btn-success mt-3">{saving ? "Preparando pago..." : "Continuar al pago"}</button>
    </form> : <section className="card p-3"><h2 className="h5">Pagar pedido</h2>
      {saving && <p role="status">Procesando pago...</p>}
      <MercadoPagoPayment order={order} user={user}
        onStatus={handlePaymentStatus}
        onError={handlePaymentError}
        onRejected={handleRejected}
        onApproved={handleApproved} />
    </section>}
  </main>;
}
