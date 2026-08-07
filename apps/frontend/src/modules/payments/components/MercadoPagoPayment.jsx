import { useCallback, useMemo } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { processMercadoPagoPayment } from "../../orders/infrastructure/orderApi";

const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
if (publicKey) initMercadoPago(publicKey, { locale: "es-PE" });

export default function MercadoPagoPayment({ order, user, onApproved, onRejected, onStatus, onError }) {
  if (!publicKey) return <div className="alert alert-warning">
    Mercado Pago no está configurado. Agrega <code>VITE_MERCADO_PAGO_PUBLIC_KEY</code> en <code>apps/frontend/.env</code> y reinicia Vite.
  </div>;

  const initialization = useMemo(() => ({
    amount: Number(order.total),
    payer: { firstName: user.firstName, lastName: user.lastName, entityType: "individual" },
  }), [order.total, user.firstName, user.lastName]);
  const customization = useMemo(() => ({
    paymentMethods: { creditCard: "all", debitCard: "all", prepaidCard: "all", maxInstallments: 12 },
    visual: { style: { theme: "default" } },
  }), []);

  const onSubmit = useCallback(async ({ formData }) => {
    onStatus("Procesando pago con Mercado Pago...");
    try {
      const updatedOrder = await processMercadoPagoPayment(order.id, formData, crypto.randomUUID());
      if (updatedOrder.payment?.status === "APPROVED") onApproved(updatedOrder);
      else {
        const message = updatedOrder.payment?.status === "REJECTED" ? "El pago fue rechazado. Prueba otro medio de pago." : "El pago está siendo procesado.";
        onError(message);
        if (updatedOrder.payment?.status === "REJECTED") onRejected();
        throw new Error(message);
      }
    } catch (error) {
      onError(error.message);
      throw error;
    } finally { onStatus(""); }
  }, [onApproved, onError, onRejected, onStatus, order.id]);

  const handleBrickError = useCallback((brickError) => {
    onError(brickError?.message || "No se pudo cargar el formulario de pago.");
  }, [onError]);

  return <Payment
    initialization={initialization}
    customization={customization}
    onSubmit={onSubmit}
    onError={handleBrickError}
  />;
}
