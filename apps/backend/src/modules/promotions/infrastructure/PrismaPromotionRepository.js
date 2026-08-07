import { AppError } from "../../../shared/errors/AppError.js";

const include = { products: { include: { product: { include: { category: true } } } } };
const serialize = (promotion) => ({
  ...promotion,
  discountValue: Number(promotion.discountValue),
  products: promotion.products.map(({ product }) => {
    const price = Number(product.price);
    const discount = promotion.discountType === "PERCENTAGE" ? price * Number(promotion.discountValue) / 100 : Number(promotion.discountValue);
    return { id: product.id, nombre: product.name, precio: price, precioPromocional: Math.max(0, price - discount), imagen: product.imageUrl, categoria: product.category.name };
  }),
});

export class PrismaPromotionRepository {
  constructor(prisma) { this.prisma = prisma; }

  async findActive(now) {
    const rows = await this.prisma.promotion.findMany({
      where: { active: true, deletedAt: null, startsAt: { lte: now }, endsAt: { gt: now } },
      include: { products: { where: { product: { active: true, deletedAt: null, stock: { gt: 0 } } }, include: { product: { include: { category: true } } } } },
      orderBy: { endsAt: "asc" },
    });
    return rows.map(serialize);
  }

  async findAll() {
    return (await this.prisma.promotion.findMany({ where: { deletedAt: null }, include, orderBy: { createdAt: "desc" } })).map(serialize);
  }

  async create(data, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      await this.#ensureProducts(transaction, data.productIds);
      const promotion = await transaction.promotion.create({ data: this.#data(data, actorId), include });
      await transaction.auditLog.create({ data: { userId: actorId, action: "PROMOTION_CREATED", entity: "Promotion", entityId: promotion.id, metadata: { name: promotion.name } } });
      return serialize(promotion);
    });
  }

  async update(id, data, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      await this.#ensureProducts(transaction, data.productIds);
      const exists = await transaction.promotion.findFirst({ where: { id, deletedAt: null } });
      if (!exists) throw new AppError("Promoción no encontrada.", 404, "PROMOTION_NOT_FOUND");
      const promotion = await transaction.promotion.update({ where: { id }, data: { ...this.#data(data), products: { deleteMany: {}, create: data.productIds.map((productId) => ({ productId })) } }, include });
      await transaction.auditLog.create({ data: { userId: actorId, action: "PROMOTION_UPDATED", entity: "Promotion", entityId: id } });
      return serialize(promotion);
    });
  }

  async remove(id, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.promotion.updateMany({ where: { id, deletedAt: null }, data: { active: false, deletedAt: new Date() } });
      if (!result.count) throw new AppError("Promoción no encontrada.", 404, "PROMOTION_NOT_FOUND");
      await transaction.auditLog.create({ data: { userId: actorId, action: "PROMOTION_REMOVED", entity: "Promotion", entityId: id } });
      return { id, active: false };
    });
  }

  #data(data, createdById) {
    return {
      name: data.name, description: data.description || null, discountType: data.discountType,
      discountValue: data.discountValue, startsAt: new Date(data.startsAt), endsAt: new Date(data.endsAt), active: data.active,
      ...(createdById ? { createdById, products: { create: data.productIds.map((productId) => ({ productId })) } } : {}),
    };
  }

  async #ensureProducts(transaction, ids) {
    const count = await transaction.product.count({ where: { id: { in: ids }, deletedAt: null } });
    if (count !== new Set(ids).size || count !== ids.length) throw new AppError("Uno o más productos no existen o están repetidos.", 400, "INVALID_PRODUCTS");
  }
}
