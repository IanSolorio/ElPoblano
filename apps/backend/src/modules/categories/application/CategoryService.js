import { AppError } from "../../../shared/errors/AppError.js";

export class CategoryService {
  constructor(repository) { this.repository = repository; }
  listActive() { return this.repository.findAll(true); }
  listAdmin() { return this.repository.findAll(false); }
  create(data, actor) { return this.repository.create(data.name, actor.id); }
  async update(id, data, actor) {
    const category = await this.repository.findById(id);
    if (!category) throw new AppError("Categoría no encontrada.", 404, "CATEGORY_NOT_FOUND");
    return this.repository.update(id, data, actor.id);
  }
}
