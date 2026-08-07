import { ProductRepository } from "../domain/ProductRepository.js";

export class InMemoryProductRepository extends ProductRepository {
  constructor(initialProducts = []) {
    super();
    this.products = new Map(initialProducts.map((product) => [product.id, product]));
  }

  async categoryIsActive(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
  }

  async findAll() {
    return [...this.products.values()];
  }

  async findById(id) {
    return this.products.get(id) ?? null;
  }

  async create(product) {
    this.products.set(product.id, product);
    return product;
  }

  async update(id, product) {
    this.products.set(id, product);
    return product;
  }

  async delete(id) {
    const product = this.products.get(id);
    this.products.delete(id);
    return product;
  }
}
