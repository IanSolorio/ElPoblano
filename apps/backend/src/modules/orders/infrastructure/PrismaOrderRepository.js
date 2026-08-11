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

export const validateOperationalTransition = (order, nextStatus) => {
  const expected = { PREPARING: "CONFIRMED", READY: "PREPARING", OUT_FOR_DELIVERY: "READY", DELIVERED: "OUT_FOR_DELIVERY" }[nextStatus];
  if (!expected || order.status !== expected) {
    throw new AppError(`No se puede cambiar un pedido ${order.status} a ${nextStatus}.`, 409, "INVALID_ORDER_STATUS_TRANSITION");
  }
  if (order.payment?.status !== "APPROVED") {
    throw new AppError("Solo se pueden preparar pedidos con pago aprobado.", 409, "PAYMENT_NOT_APPROVED");
  }
  return expected;
};

export const calculatePromotionSelection = (product) => product.promotions.reduce((best, { promotion }) => {
  const discountValue = Number(promotion.discountValue);
  const discount = promotion.discountType === "PERCENTAGE" ? Number(product.price) * discountValue / 100 : discountValue;
  const price = Math.max(0, Number(product.price) - discount);
  return price < best.price ? { price, promotionId: promotion.id, promotionName: promotion.name } : best;
}, { price: Number(product.price), promotionId: null, promotionName: null });

export const calculatePromotionalPrice = (product) => calculatePromotionSelection(product).price;

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

    try {
      return await this.prisma.$transaction(async (transaction) => {
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
        const selectedPromotion = calculatePromotionSelection(product);
        const unitCents = Math.round(selectedPromotion.price * 100);
        return { productId: product.id, productName: product.name, promotionId: selectedPromotion.promotionId, promotionName: selectedPromotion.promotionName, unitPrice: unitCents / 100, quantity, subtotal: (unitCents * quantity) / 100 };
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
      if (process.env.NODE_ENV === "test" && process.env.JMETER_INJECT_ORDER_FAILURE === "true" && input.notes === "[JM-CON-03]") {
        throw new AppError("Fallo transaccional inyectado exclusivamente para JM-CON-03.", 503, "JMETER_INJECTED_FAILURE");
      }
      await transaction.auditLog.create({ data: { userId: input.user.id, action: "ORDER_CREATED", entity: "Order", entityId: order.id } });
      return serializeOrder(order);
      });
    } catch (error) {
      if (error?.code === "P2002") {
        const concurrent = await this.prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: orderInclude });
        if (concurrent?.userId === input.user.id) return serializeOrder(concurrent);
      }
      throw error;
    }
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

  async findActiveByUser(userId) {
    const statuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];
    const orders = await this.prisma.order.findMany({ where: { userId, status: { in: statuses } }, include: orderInclude, orderBy: { createdAt: "desc" } });
    return orders.map(serializeOrder);
  }

  async findMonthlyHistoryByUser(userId) {
    const orders = await this.prisma.order.findMany({ where: { userId, status: "DELIVERED" }, include: orderInclude, orderBy: { createdAt: "desc" } });
    const months = new Map();
    for (const order of orders.map(serializeOrder)) {
      const date = new Date(order.createdAt);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const current = months.get(key) || { month: key, orderCount: 0, totalSpent: 0, orders: [] };
      current.orderCount += 1;
      current.totalSpent += order.total;
      current.orders.push(order);
      months.set(key, current);
    }
    return [...months.values()];
  }

  async cancelPendingByUser(id, userId) {
    return this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findFirst({ where: { id, userId }, include: orderInclude });
      if (!order) throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
      if (order.status !== "PENDING" || order.payment?.status !== "PENDING") {
        throw new AppError("Solo puedes cancelar pedidos que todavía no han sido pagados.", 409, "ORDER_CANNOT_BE_CANCELLED");
      }
      if (order.payment.externalId) {
        throw new AppError("Mercado Pago ya está procesando este pago. Espera su resultado antes de realizar otra acción.", 409, "PAYMENT_ALREADY_PROCESSING");
      }

      const cancelled = await transaction.order.updateMany({
        where: { id, userId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      if (cancelled.count !== 1) throw new AppError("El pedido cambió mientras intentabas cancelarlo. Actualiza la página.", 409, "ORDER_STATUS_CONFLICT");

      for (const item of order.items) {
        await transaction.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      await transaction.inventoryMovement.createMany({
        data: order.items.map((item) => ({ productId: item.productId, type: "RETURN", quantity: item.quantity, reason: "Pedido cancelado por el cliente", reference: id })),
      });
      await transaction.auditLog.create({ data: { userId, action: "ORDER_CANCELLED_BY_CUSTOMER", entity: "Order", entityId: id } });
      return serializeOrder(await transaction.order.findUnique({ where: { id }, include: orderInclude }));
    });
  }

  async findAllForAdmin({ page, limit, status, search }) {
    const searchable = search ? {
      OR: [
        { id: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
      ],
    } : {};
    const where = { ...searchable, ...(status ? { status } : {}) };
    const [orders, total, grouped] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({ by: ["status"], where: searchable, _count: { _all: true } }),
    ]);
    const counts = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]));
    return {
      data: orders.map(serializeOrder),
      summary: {
        confirmed: counts.CONFIRMED || 0,
        preparing: counts.PREPARING || 0,
        ready: counts.READY || 0,
        outForDelivery: counts.OUT_FOR_DELIVERY || 0,
        delivered: counts.DELIVERED || 0,
        pending: counts.PENDING || 0,
        cancelled: counts.CANCELLED || 0,
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findByIdForAdmin(id) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: orderInclude });
    return order ? serializeOrder(order) : null;
  }

  async updateOperationalStatus(id, nextStatus, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({ where: { id }, include: orderInclude });
      if (!order) throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
      const expected = validateOperationalTransition(order, nextStatus);
      const updated = await transaction.order.updateMany({ where: { id, status: expected }, data: { status: nextStatus } });
      if (updated.count !== 1) throw new AppError("El pedido fue actualizado por otro administrador. Recarga la lista.", 409, "ORDER_STATUS_CONFLICT");
      await transaction.auditLog.create({
        data: { userId: actorId, action: "ORDER_STATUS_UPDATED", entity: "Order", entityId: id, metadata: { previousStatus: expected, newStatus: nextStatus } },
      });
      return serializeOrder(await transaction.order.findUnique({ where: { id }, include: orderInclude }));
    });
  }

  async getMonthlyStatistics(month) {
    const [year, monthNumber] = month.split("-").map(Number);
    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 1));
    const orders = await this.prisma.order.findMany({
      where: { payment: { is: { status: "APPROVED", paidAt: { gte: start, lt: end } } } },
      include: { payment: true, items: { include: { promotion: { include: { products: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    const products = new Map();
    const promotionGroups = new Map();
    for (const order of orders) {
      for (const item of order.items) {
        const product = products.get(item.productId) || { productId: item.productId, name: item.productName, units: 0, revenue: 0 };
        product.units += item.quantity;
        product.revenue += Number(item.subtotal);
        products.set(item.productId, product);
        if (item.promotionId) {
          const key = `${order.id}:${item.promotionId}`;
          const group = promotionGroups.get(key) || { promotion: item.promotion, name: item.promotionName, items: [], revenue: 0 };
          group.items.push(item);
          group.revenue += Number(item.subtotal);
          promotionGroups.set(key, group);
        }
      }
    }
    const promotions = new Map();
    for (const group of promotionGroups.values()) {
      const promotion = group.promotion;
      let units = group.items.reduce((sum, item) => sum + item.quantity, 0);
      if (promotion?.kind === "BUNDLE") {
        units = Math.min(...group.items.map((item) => {
          const component = promotion.products.find((entry) => entry.productId === item.productId);
          return Math.floor(item.quantity / Math.max(1, component?.quantity || 1));
        }));
      }
      const current = promotions.get(promotion?.id) || { promotionId: promotion?.id, name: group.name, kind: promotion?.kind || "PRODUCT_DISCOUNT", units: 0, revenue: 0 };
      current.units += units;
      current.revenue += group.revenue;
      promotions.set(current.promotionId, current);
    }
    const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const byStatus = Object.fromEntries(Object.entries(orders.reduce((counts, order) => ({ ...counts, [order.status]: (counts[order.status] || 0) + 1 }), {})));
    return {
      month,
      summary: { orders: orders.length, revenue, averageTicket: orders.length ? revenue / orders.length : 0, customers: new Set(orders.map((order) => order.userId)).size, productsSold: [...products.values()].reduce((sum, item) => sum + item.units, 0) },
      ordersByStatus: byStatus,
      topProducts: [...products.values()].sort((a, b) => b.units - a.units).slice(0, 10),
      topPromotions: [...promotions.values()].sort((a, b) => b.units - a.units).slice(0, 10),
    };
  }

  async updatePaymentFromProvider(orderId, providerPayment) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.order.findUnique({ where: { id: orderId }, include: orderInclude });
      if (!existing) throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
      // Una notificación atrasada nunca debe degradar un pago que ya fue aprobado.
      if (existing.payment?.status === "APPROVED" && providerPayment.status !== "REFUNDED") {
        return serializeOrder(existing);
      }
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
        const confirmed = await transaction.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "CONFIRMED" } });
        if (confirmed.count !== 1) return serializeOrder(await transaction.order.findUnique({ where: { id: orderId }, include: orderInclude }));
        await transaction.auditLog.create({ data: { userId: existing.userId, action: "PAYMENT_APPROVED", entity: "Order", entityId: orderId, metadata: { providerPaymentId: providerPayment.id } } });
      }
      if (providerPayment.status === "REJECTED" && existing.status === "PENDING") {
        const cancelled = await transaction.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "CANCELLED" } });
        if (cancelled.count !== 1) return serializeOrder(await transaction.order.findUnique({ where: { id: orderId }, include: orderInclude }));
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
