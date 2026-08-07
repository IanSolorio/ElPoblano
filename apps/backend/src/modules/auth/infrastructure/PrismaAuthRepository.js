export class PrismaAuthRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  findByEmail(email) {
    return this.prisma.user.findUnique({ where: { email }, include: { addresses: true } });
  }

  createUser(data) {
    return this.prisma.user.create({ data, include: { addresses: true } });
  }

  createSession(data) {
    return this.prisma.session.create({ data });
  }

  findActiveSession(tokenHash) {
    return this.prisma.session.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { active: true } },
      include: { user: { include: { addresses: true } } },
    });
  }

  revokeSession(tokenHash) {
    return this.prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  writeAudit(data) {
    return this.prisma.auditLog.create({ data });
  }
}
