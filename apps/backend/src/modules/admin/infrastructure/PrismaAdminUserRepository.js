const publicUser = ({ passwordHash: _passwordHash, ...user }) => user;

export class PrismaAdminUserRepository {
  constructor(prisma) { this.prisma = prisma; }
  findById(id) { return this.prisma.user.findUnique({ where: { id } }); }
  findByEmail(email) { return this.prisma.user.findUnique({ where: { email } }); }

  async findAll({ page, limit, role, search }) {
    const where = { deletedAt: null, ...(role ? { role } : {}), ...(search ? { OR: [{ email: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }] } : {}) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.user.count({ where }),
    ]);
    return { data: rows.map(publicUser), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createAdmin(data, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({ data: { email: data.email, passwordHash: data.passwordHash, firstName: data.firstName, lastName: data.lastName, phone: data.phone || null, role: "ADMIN" } });
      await transaction.auditLog.create({ data: { userId: actorId, action: "ADMIN_CREATED", entity: "User", entityId: user.id, metadata: { email: user.email } } });
      return publicUser(user);
    });
  }

  async update(id, data, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.update({ where: { id }, data: { firstName: data.firstName, lastName: data.lastName, phone: data.phone || null } });
      await transaction.auditLog.create({ data: { userId: actorId, action: "USER_UPDATED", entity: "User", entityId: id } });
      return publicUser(user);
    });
  }

  async setStatus(id, active, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.update({ where: { id }, data: { active } });
      if (!active) await transaction.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await transaction.auditLog.create({ data: { userId: actorId, action: active ? "USER_ACTIVATED" : "USER_DEACTIVATED", entity: "User", entityId: id } });
      return publicUser(user);
    });
  }

  async remove(id, actorId) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.update({ where: { id }, data: { active: false, deletedAt: new Date() } });
      await transaction.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await transaction.auditLog.create({ data: { userId: actorId, action: "USER_DELETED", entity: "User", entityId: id } });
      return publicUser(user);
    });
  }
}
