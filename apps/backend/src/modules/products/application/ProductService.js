import { randomUUID } from "node:crypto";
import { Product } from "../domain/Product.js";

export class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  list() {
    return this.productRepository.findAll();
  }

  listAdmin() {
    return this.productRepository.findAllAdmin();
  }

  async getById(id) {
    const product = await this.productRepository.findById(id);
    if (!product) throw Object.assign(new Error("Producto no encontrado."), { status: 404 });
    return product;
  }

  async create(data, actor) {
    if (!(await this.productRepository.categoryIsActive(data.categoriaId))) throw Object.assign(new Error("Selecciona una categoría activa."), { status: 400, code: "INVALID_CATEGORY" });
    return this.productRepository.create(new Product({ ...data, id: randomUUID() }), actor.id);
  }

  async update(id, data, actor) {
    await this.getById(id);
    if (!(await this.productRepository.categoryIsActive(data.categoriaId))) throw Object.assign(new Error("Selecciona una categoría activa."), { status: 400, code: "INVALID_CATEGORY" });
    return this.productRepository.update(id, new Product({ ...data, id }), actor.id);
  }

  async delete(id, actor) {
    await this.getById(id);
    return this.productRepository.delete(id, actor.id);
  }
}
