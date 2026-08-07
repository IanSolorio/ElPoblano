import { ProductRepository } from "../domain/ProductRepository.js";

const toDomain = (product) => ({
  id: product.id,
  nombre: product.name,
  descripcion: product.description,
  categoria: product.category.name,
  categoriaId: product.category.id,
  precio: Number(product.price),
  imagen: product.imageUrl ?? "",
  stock: product.stock,
  activo: product.active,
});

export class PrismaProductRepository extends ProductRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async categoryIsActive(id) {
    return Boolean(await this.prisma.category.findFirst({ where: { id: Number(id), active: true }, select: { id: true } }));
  }

  async findAll() {
    const products = await this.prisma.product.findMany({
      where: { active: true, deletedAt: null, stock: { gt: 0 }, category: { active: true } },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return products.map(toDomain);
  }

  async findAllAdmin() {
    return (await this.prisma.product.findMany({
      where: { deletedAt: null }, include: { category: true }, orderBy: { createdAt: "desc" },
    })).map(toDomain);
  }

  async findById(id) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });
    return product ? toDomain(product) : null;
  }

  async create(product, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.product.create({ data: this.#toPersistence(product), include: { category: true } });
      await transaction.auditLog.create({ data: { userId: actorId, action: "PRODUCT_CREATED", entity: "Product", entityId: created.id, metadata: { name: created.name } } });
      return toDomain(created);
    });
  }

  async update(id, product, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      const previous = await transaction.product.findUniqueOrThrow({ where: { id }, select: { stock: true } });
      const updated = await transaction.product.update({ where: { id }, data: this.#toPersistence(product), include: { category: true } });
      const stockDifference = updated.stock - previous.stock;
      if (stockDifference !== 0) {
        await transaction.inventoryMovement.create({
          data: { productId: id, type: "ADJUSTMENT", quantity: stockDifference, reason: "Ajuste realizado desde el panel administrativo" },
        });
      }
      await transaction.auditLog.create({
        data: { userId: actorId, action: "PRODUCT_UPDATED", entity: "Product", entityId: id, metadata: { previousStock: previous.stock, newStock: updated.stock } },
      });
      return toDomain(updated);
    });
  }

  async delete(id, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      const deleted = await transaction.product.update({ where: { id }, data: { active: false, deletedAt: new Date() }, include: { category: true } });
      await transaction.auditLog.create({ data: { userId: actorId, action: "PRODUCT_RETIRED", entity: "Product", entityId: id } });
      return toDomain(deleted);
    });
  }

  #toPersistence(product) {
    return {
      name: product.nombre,
      description: product.descripcion,
      price: product.precio,
      imageUrl: product.imagen || null,
      stock: product.stock,
      active: product.activo,
      category: { connect: { id: product.categoriaId } },
    };
  }
}
