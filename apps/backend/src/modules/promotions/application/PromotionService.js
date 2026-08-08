import { AppError } from "../../../shared/errors/AppError.js";

export class PromotionService {
  constructor(repository) { this.repository = repository; }

  listActive() { return this.repository.findActive(new Date()); }
  listAdmin() { return this.repository.findAll(); }

  create(data, actor) {
    this.#validate(data);
    return this.repository.create(data, actor.id);
  }

  update(id, data, actor) {
    this.#validate(data);
    return this.repository.update(id, data, actor.id);
  }

  remove(id, actor) { return this.repository.remove(id, actor.id); }

  #validate(data) {
    if (new Date(data.startsAt) >= new Date(data.endsAt)) throw new AppError("La fecha final debe ser posterior a la inicial.", 400, "INVALID_PROMOTION_PERIOD");
    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) throw new AppError("El porcentaje no puede superar 100.", 400, "INVALID_DISCOUNT");
    if (data.kind === "BUNDLE" && data.products.length < 2) throw new AppError("Un combo debe contener al menos dos productos.", 400, "INVALID_BUNDLE");
    if (data.kind === "BUNDLE" && !data.imageUrl) throw new AppError("Agrega una imagen representativa para el combo.", 400, "BUNDLE_IMAGE_REQUIRED");
  }
}
