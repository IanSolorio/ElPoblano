const slugify = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const serialize = ({ id, name, slug, active }) => ({ id, nombre: name, slug, activo: active });

export class PrismaCategoryRepository {
  constructor(prisma) { this.prisma = prisma; }
  async findAll(onlyActive) { return (await this.prisma.category.findMany({ where: onlyActive ? { active: true } : {}, orderBy: { name: "asc" } })).map(serialize); }
  async findById(id) { const row = await this.prisma.category.findUnique({ where: { id } }); return row ? serialize(row) : null; }
  async create(name, actorId) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.category.create({ data: { name: name.trim(), slug: slugify(name), active: true } });
      await tx.auditLog.create({ data: { userId: actorId, action: "CATEGORY_CREATED", entity: "Category", entityId: String(row.id), metadata: { name: row.name } } });
      return serialize(row);
    });
  }
  async update(id, data, actorId) {
    return this.prisma.$transaction(async (tx) => {
      const update = { active: data.activo };
      if (data.nombre) { update.name = data.nombre.trim(); update.slug = slugify(data.nombre); }
      const row = await tx.category.update({ where: { id }, data: update });
      await tx.auditLog.create({ data: { userId: actorId, action: "CATEGORY_UPDATED", entity: "Category", entityId: String(id), metadata: { name: row.name, active: row.active } } });
      return serialize(row);
    });
  }
}
