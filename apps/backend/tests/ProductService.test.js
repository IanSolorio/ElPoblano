import assert from "node:assert/strict";
import test from "node:test";
import { ProductService } from "../src/modules/products/application/ProductService.js";
import { InMemoryProductRepository } from "../src/modules/products/infrastructure/InMemoryProductRepository.js";

test("crea y lista productos", async () => {
  const service = new ProductService(new InMemoryProductRepository());
  const created = await service.create({
    nombre: "Taco al pastor",
    descripcion: "Taco con carne al pastor",
    categoriaId: 1,
    precio: 8,
  }, { id: "admin-1" });

  assert.ok(created.id);
  assert.deepEqual(await service.list(), [created]);
});
