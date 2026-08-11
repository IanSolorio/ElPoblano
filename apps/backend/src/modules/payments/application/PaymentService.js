import { MercadoPagoConfig, Payment } from "mercadopago";
import { AppError } from "../../../shared/errors/AppError.js";

const statusMap = { approved: "APPROVED", rejected: "REJECTED", refunded: "REFUNDED" };

export class PaymentService {
  constructor(orderRepository, accessToken, notificationUrl, providerMode) {
    this.orderRepository = orderRepository;
    this.notificationUrl = notificationUrl;
    this.providerMode = providerMode;
    this.paymentClient = providerMode === "stub"
      ? {
        create: async ({ body }) => ({
          id: `e2e-${crypto.randomUUID()}`,
          status: body.token === "e2e-rejected" ? "rejected" : "approved",
          payment_method_id: body.payment_method_id,
          payment_type_id: body.payment_method_id === "yape" ? "bank_transfer" : "credit_card",
        }),
      }
      : accessToken
      ? new Payment(new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } }))
      : null;
  }

  ensureConfigured() {
    if (!this.paymentClient) throw new AppError("Mercado Pago no está configurado. Agrega las credenciales de prueba.", 503, "PAYMENT_PROVIDER_NOT_CONFIGURED");
  }

  async process(user, { orderId, paymentData }, idempotencyKey) {
    this.ensureConfigured();
    if (!idempotencyKey) throw new AppError("Falta la cabecera Idempotency-Key.", 400, "IDEMPOTENCY_KEY_REQUIRED");
    const order = await this.orderRepository.findByIdAndUser(orderId, user.id);
    if (!order) throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
    if (order.payment?.status === "APPROVED") return order;
    if (order.status === "CANCELLED") throw new AppError("El pedido fue cancelado. Crea uno nuevo para volver a pagar.", 409, "ORDER_CANCELLED");
    if (order.payment?.status === "PENDING" && order.payment.externalId) {
      throw new AppError("Este pago ya está siendo procesado por Mercado Pago.", 409, "PAYMENT_ALREADY_PROCESSING");
    }
    const transactionAmount = Number(Number(order.total).toFixed(2));
    if (!Number.isFinite(transactionAmount) || transactionAmount < 3) {
      throw new AppError("El monto del pedido no es válido para Mercado Pago. Usa un total de al menos S/ 3.00.", 422, "INVALID_PAYMENT_AMOUNT");
    }

    const body = {
      transaction_amount: transactionAmount,
      token: paymentData.token,
      description: `Pedido ElPoblano ${order.id.slice(0, 8)}`,
      installments: paymentData.installments || 1,
      payment_method_id: paymentData.payment_method_id,
      issuer_id: paymentData.issuer_id ? Number(paymentData.issuer_id) : undefined,
      payer: {
        email: paymentData.payer?.email || user.email,
        identification: paymentData.payer?.identification,
        first_name: user.firstName,
        last_name: user.lastName,
      },
      external_reference: order.id,
      notification_url: this.notificationUrl || undefined,
      metadata: { order_id: order.id, user_id: user.id },
    };

    try {
      const providerPayment = await this.paymentClient.create({ body, requestOptions: { idempotencyKey } });
      return this.orderRepository.updatePaymentFromProvider(order.id, {
        id: String(providerPayment.id),
        status: statusMap[providerPayment.status] || "PENDING",
        method: this.mapMethod(providerPayment),
      });
    } catch (error) {
      const providerMessage = error?.cause?.[0]?.description || error?.message;
      throw new AppError(providerMessage || "Mercado Pago no pudo procesar el pago.", 422, "PAYMENT_PROCESSING_FAILED");
    }
  }

  async synchronize(providerPaymentId) {
    this.ensureConfigured();
    if (this.providerMode === "stub") {
      const match = String(providerPaymentId).match(/^stub-(approved|rejected)-([0-9a-f-]{36})$/i);
      if (!match) return null;
      return this.orderRepository.updatePaymentFromProvider(match[2], {
        id: String(providerPaymentId),
        status: match[1].toUpperCase(),
        method: "CREDIT_CARD",
      });
    }
    const providerPayment = await this.paymentClient.get({ id: providerPaymentId });
    if (!providerPayment.external_reference) return null;
    return this.orderRepository.updatePaymentFromProvider(providerPayment.external_reference, {
      id: String(providerPayment.id),
      status: statusMap[providerPayment.status] || "PENDING",
      method: this.mapMethod(providerPayment),
    });
  }

  mapMethod(providerPayment) {
    if (providerPayment.payment_method_id === "yape") return "YAPE";
    if (providerPayment.payment_type_id === "debit_card") return "DEBIT_CARD";
    if (providerPayment.payment_type_id === "prepaid_card") return "PREPAID_CARD";
    return "CREDIT_CARD";
  }
}
