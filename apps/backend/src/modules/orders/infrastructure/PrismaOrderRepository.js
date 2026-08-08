import { AppError } from "../../../shared/errors/AppError.js";
import { OrderRepository } from "../domain/OrderRepository.js";

const orderInclude = { items: true, payment: true };
const serializeOrder = (order) => ({
  ...order,
  subtotal: Number(order.subtotal),
  deliveryFee: Number(order.deliveryFee),
  total: Number(order.total),
  items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), subtotal: Number(item.subtotal) })),
  payment: order.payment ? { ...order.payment, amount: Number(order.payment.amount) } : null,
});

export const calculatePromotionalPrice = (product) => product.promotions.reduce((lowestPrice, { promotion }) => {
  const discountValue = Number(promotion.discountValue);
  const discount = promotion.discountType === "PERCENTAGE"
    ? Number(product.price) * discountValue / 100
    : discountValue;
  return Math.min(lowestPrice, Math.max(0, Number(product.price) - discount));
}, Number(product.price));

const allocateBundleItems = (bundle, bundleQuantity) => {
  const components = bundle.products.map(({ product, quantity }) => ({ product, quantity: quantity * bundleQuantity, weight: Math.round(Number(product.price) * 100) * quantity * bundleQuantity }));
  const totalCents = Math.round(Number(bundle.bundlePrice) * 100) * bundleQuantity;
  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
  let assignedCents = 0;
  return components.map((component, index) => {
    const subtotalCents = index === components.length - 1 ? totalCents - assignedCents : Math.round(totalCents * component.weight / totalWeight);
    assignedCents += subtotalCents;
    return {
      productId: component.product.id, productName: component.product.name,
      promotionId: bundle.id, promotionName: bundle.name,
      unitPrice: subtotalCents / component.quantity / 100,
      quantity: component.quantity, subtotal: subtotalCents / 100,
    };
  });
};

export class PrismaOrderRepository extends OrderRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(input) {
    const previous = await this.prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: orderInclude });
    if (previous) {
      if (previous.userId !== input.user.id) throw new AppError("La clave de idempotencia ya está en uso.", 409, "IDEMPOTENCY_CONFLICT");
      return serializeOrder(previous);
    }

    const productLines = input.items.filter((item) => item.productId);
    const bundleLines = input.items.filter((item) => item.promotionId);
    const requested = new Map(productLines.map((item) => [item.productId, item.quantity]));
    const requestedBundles = new Map(bundleLines.map((item) => [item.promotionId, item.quantity]));
    if (requested.size !== productLines.length || requestedBundles.size !== bundleLines.length) {
      throw new AppError("No repitas productos ni combos en el pedido.", 400, "DUPLICATE_ORDER_LINE");
    }

    return this.prisma.$transaction(async (transaction) => {
      const address = await transaction.address.findFirst({
        where: { id: input.addressId, userId: input.user.id },
      });
      if (!address) throw new AppError("Selecciona una dirección de entrega válida.", 400, "DELIVERY_ADDRESS_REQUIRED");

      const now = new Date();
      const products = await transaction.product.findMany({
        where: { id: { in: [...requested.keys()] }, active: true, deletedAt: null },
        include: {
          promotions: {
            where: { promotion: { active: true, deletedAt: null, startsAt: { lte: now }, endsAt: { gt: now } } },
            include: { promotion: true },
          },
        },
      });
      if (products.length !== requested.size) throw new AppError("Uno o más productos no están disponibles.", 409, "PRODUCT_UNAVAILABLE");

      const bundles = await transaction.promotion.findMany({
        where: { id: { in: [...requestedBundles.keys()] }, kind: "BUNDLE", active: true, deletedAt: null, startsAt: { lte: now }, endsAt: { gt: now }, bundlePrice: { not: null } },
        include: { products: { include: { product: true } } },
      });
      if (bundles.length !== requestedBundles.size) throw new AppError("Uno o más combos ya no están disponibles.", 409, "BUNDLE_UNAVAILABLE");
      if (bundles.some((bundle) => bundle.products.length < 2 || bundle.products.some(({ product }) => !product.active || product.deletedAt))) {
        throw new AppError("Uno o más combos contienen productos no disponibles.", 409, "BUNDLE_UNAVAILABLE");
      }

      const items = products.map((product) => {
        const quantity = requested.get(product.id);
        const unitPrice = calculatePromotionalPrice(product);
        const unitCents = Math.round(unitPrice * 100);
        return { productId: product.id, productName: product.name, unitPrice: unitCents / 100, quantity, subtotal: (unitCents * quantity) / 100 };
      });
      for (const bundle of bundles) items.push(...allocateBundleItems(bundle, requestedBundles.get(bundle.id)));
      const subtotal = items.reduce((total, item) => total + Number(item.subtotal), 0);
      const deliveryFee = 0;
      if (!Number.isFinite(subtotal) || subtotal < 3) {
        throw new AppError("Mercado Pago requiere un total válido. Para las pruebas usa un pedido de al menos S/ 3.00.", 400, "PAYMENT_AMOUNT_TOO_LOW");
      }

      const stockRequired = new Map();
      for (const item of items) stockRequired.set(item.productId, (stockRequired.get(item.productId) || 0) + item.quantity);
      for (const [productId, quantity] of stockRequired) {
        const productName = items.find((item) => item.productId === productId).productName;
        const updated = await transaction.product.updateMany({
          where: { id: productId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (updated.count !== 1) throw new AppError(`Stock insuficiente para ${productName}.`, 409, "INSUFFICIENT_STOCK");
      }

      const order = await transaction.order.create({
        data: {
          userId: input.user.id,
          idempotencyKey: input.idempotencyKey,
          customerName: `${input.user.firstName} ${input.user.lastName}`,
          customerEmail: input.user.email,
          customerPhone: input.phone || input.user.phone || "",
          deliveryAddress: address.addressLine,
          deliveryLatitude: address.latitude,
          deliveryLongitude: address.longitude,
          notes: input.notes,
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          items: { create: items },
          payment: {
            create: {
              method: input.paymentMethod,
              provider: input.paymentMethod === "YAPE" ? "YAPE_PENDING_INTEGRATION" : "CARD_PENDING_INTEGRATION",
              amount: subtotal + deliveryFee,
            },
          },
        },
        include: orderInclude,
      });

      await transaction.inventoryMovement.createMany({
        data: [...stockRequired].map(([productId, quantity]) => ({ productId, type: "SALE", quantity: -quantity, reference: order.id })),
      });
      await transaction.auditLog.create({ data: { userId: input.user.id, action: "ORDER_CREATED", entity: "Order", entityId: order.id } });
      return serializeOrder(order);
    });
  }

  async findByUser(userId, { page, limit }) {
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where: { userId }, include: orderInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { data: orders.map(serializeOrder), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findByIdAndUser(id, userId) {
    const order = await this.prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
    return order ? serializeOrder(order) : null;
  }

  async updatePaymentFromProvider(orderId, providerPayment) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.order.findUnique({ where: { id: orderId }, include: orderInclude });
      if (!existing) throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
      const approved = providerPayment.status === "APPROVED";
      await transaction.payment.update({
        where: { orderId },
        data: {
          provider: "MERCADO_PAGO",
          externalId: providerPayment.id,
          status: providerPayment.status,
          method: providerPayment.method,
          paidAt: approved ? new Date() : null,
        },
      });
      if (approved && existing.status === "PENDING") {
        await transaction.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
        await transaction.auditLog.create({ data: { userId: existing.userId, action: "PAYMENT_APPROVED", entity: "Order", entityId: orderId, metadata: { providerPaymentId: providerPayment.id } } });
      }
      if (providerPayment.status === "REJECTED" && existing.status === "PENDING") {
        await transaction.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
        for (const item of existing.items) {
          await transaction.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
        await transaction.inventoryMovement.createMany({
          data: existing.items.map((item) => ({ productId: item.productId, type: "RETURN", quantity: item.quantity, reason: "Pago rechazado", reference: orderId })),
        });
        await transaction.auditLog.create({ data: { userId: existing.userId, action: "PAYMENT_REJECTED", entity: "Order", entityId: orderId, metadata: { providerPaymentId: providerPayment.id } } });
      }
      const updated = await transaction.order.findUnique({ where: { id: orderId }, include: orderInclude });
      return serializeOrder(updated);
    });
  }
}
