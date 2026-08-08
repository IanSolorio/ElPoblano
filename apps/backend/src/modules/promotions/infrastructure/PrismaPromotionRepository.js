import { AppError } from "../../../shared/errors/AppError.js";

const include = { products: { include: { product: { include: { category: true } } } } };

const serialize = (promotion) => ({
  ...promotion,
  discountValue: promotion.discountValue == null ? null : Number(promotion.discountValue),
  bundlePrice: promotion.bundlePrice == null ? null : Number(promotion.bundlePrice),
  products: promotion.products.map(({ product, quantity }) => {
    const price = Number(product.price);
    const discountValue = Number(promotion.discountValue || 0);
    const discount = promotion.discountType === "PERCENTAGE" ? price * discountValue / 100 : discountValue;
    return {
      id: product.id,
      nombre: product.name,
      precio: price,
      precioPromocional: promotion.kind === "PRODUCT_DISCOUNT" ? Math.max(0, price - discount) : null,
      imagen: product.imageUrl,
      categoria: product.category.name,
      stock: product.stock,
      quantity,
    };
  }),
});

const isProductAvailable = ({ product, quantity }) => product.active && !product.deletedAt && product.stock >= quantity;

export class PrismaPromotionRepository {
  constructor(prisma) { this.prisma = prisma; }

  async findActive(now) {
    const rows = await this.prisma.promotion.findMany({
      where: { active: true, deletedAt: null, startsAt: { lte: now }, endsAt: { gt: now } },
      include,
      orderBy: { endsAt: "asc" },
    });
    return rows.flatMap((row) => {
      if (row.kind === "BUNDLE") return row.products.length >= 2 && row.products.every(isProductAvailable) ? [serialize(row)] : [];
      const availableProducts = row.products.filter(isProductAvailable);
      return availableProducts.length ? [serialize({ ...row, products: availableProducts })] : [];
    });
  }

  async findAll() {
    return (await this.prisma.promotion.findMany({ where: { deletedAt: null }, include, orderBy: { createdAt: "desc" } })).map(serialize);
  }

  async create(data, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      await this.#ensureProducts(transaction, data.products);
      const promotion = await transaction.promotion.create({ data: this.#data(data, actorId), include });
      await transaction.auditLog.create({ data: { userId: actorId, action: "PROMOTION_CREATED", entity: "Promotion", entityId: promotion.id, metadata: { name: promotion.name, kind: promotion.kind } } });
      return serialize(promotion);
    });
  }

  async update(id, data, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      await this.#ensureProducts(transaction, data.products);
      const exists = await transaction.promotion.findFirst({ where: { id, deletedAt: null } });
      if (!exists) throw new AppError("Promoción no encontrada.", 404, "PROMOTION_NOT_FOUND");
      const promotion = await transaction.promotion.update({
        where: { id },
        data: { ...this.#data(data), products: { deleteMany: {}, create: data.products.map(({ productId, quantity }) => ({ productId, quantity })) } },
        include,
      });
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
    const base = {
      name: data.name,
      description: data.description || null,
      kind: data.kind,
      discountType: data.kind === "PRODUCT_DISCOUNT" ? data.discountType : null,
      discountValue: data.kind === "PRODUCT_DISCOUNT" ? data.discountValue : null,
      bundlePrice: data.kind === "BUNDLE" ? data.bundlePrice : null,
      imageUrl: data.kind === "BUNDLE" ? data.imageUrl || null : null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      active: data.active,
    };
    return createdById
      ? { ...base, createdById, products: { create: data.products.map(({ productId, quantity }) => ({ productId, quantity })) } }
      : base;
  }

  async #ensureProducts(transaction, products) {
    const ids = products.map(({ productId }) => productId);
    const count = await transaction.product.count({ where: { id: { in: ids }, deletedAt: null } });
    if (count !== new Set(ids).size || count !== ids.length) throw new AppError("Uno o más productos no existen o están repetidos.", 400, "INVALID_PRODUCTS");
  }
}
