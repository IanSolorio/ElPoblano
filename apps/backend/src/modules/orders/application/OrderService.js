import { AppError } from "../../../shared/errors/AppError.js";

export class OrderService {
  constructor(repository) {
    this.repository = repository;
  }

  create(user, data, idempotencyKey) {
    if (!idempotencyKey) throw new AppError("Falta la cabecera Idempotency-Key.", 400, "IDEMPOTENCY_KEY_REQUIRED");
    return this.repository.create({ user, ...data, idempotencyKey });
  }

  history(userId, pagination) {
    return this.repository.findByUser(userId, pagination);
  }

  async getById(userId, orderId) {
    const order = await this.repository.findByIdAndUser(orderId, userId);
    if (!order) throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
    return order;
  }
}
