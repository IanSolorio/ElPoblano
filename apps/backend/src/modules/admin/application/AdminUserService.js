import { AppError } from "../../../shared/errors/AppError.js";

export class AdminUserService {
  constructor(repository, passwordHasher) { this.repository = repository; this.passwordHasher = passwordHasher; }

  list(query) { return this.repository.findAll(query); }

  async createAdmin(data, actor) {
    this.#superAdmin(actor);
    if (await this.repository.findByEmail(data.email.toLowerCase())) throw new AppError("El correo ya está registrado.", 409, "EMAIL_ALREADY_EXISTS");
    return this.repository.createAdmin({ ...data, email: data.email.toLowerCase(), passwordHash: await this.passwordHasher.hash(data.password) }, actor.id);
  }

  async update(id, data, actor) {
    const target = await this.#target(id);
    this.#canManage(target, actor);
    return this.repository.update(id, data, actor.id);
  }

  async setStatus(id, active, actor) {
    if (id === actor.id && !active) throw new AppError("No puedes desactivar tu propia cuenta.", 409, "SELF_DEACTIVATION");
    const target = await this.#target(id, active);
    this.#canManage(target, actor);
    return this.repository.setStatus(id, active, actor.id);
  }

  async remove(id, actor) { return this.setStatus(id, false, actor); }

  async #target(id, allowInactive = false) {
    const user = await this.repository.findById(id);
    if (!user || (user.deletedAt && !allowInactive)) throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
    return user;
  }

  #canManage(target, actor) {
    if (target.role !== "CUSTOMER" && actor.role !== "SUPER_ADMIN") throw new AppError("Solo el administrador principal puede gestionar administradores.", 403, "SUPER_ADMIN_REQUIRED");
  }

  #superAdmin(actor) {
    if (actor.role !== "SUPER_ADMIN") throw new AppError("Acceso restringido al administrador principal.", 403, "SUPER_ADMIN_REQUIRED");
  }
}
