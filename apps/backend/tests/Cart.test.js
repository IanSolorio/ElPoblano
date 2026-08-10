import assert from "node:assert/strict";
import test from "node:test";
import { addOrIncrementItem, calculateCartTotal, removeItemById, setItemQuantity } from "../../frontend/src/modules/cart/domain/cart.js";
import { deleteCart, readCart, writeCart } from "../../frontend/src/modules/cart/infrastructure/cartStorage.js";

const installBrowserStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial)); const events = [];
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  globalThis.CustomEvent = class { constructor(type) { this.type = type; } };
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  return { values, events };
};

test("UT-CART-01: agregar producto nuevo crea una línea con cantidad uno", () => {
  const result = addOrIncrementItem([], { id: "p1", nombre: "Taco", precio: 8, stock: 5 }); assert.equal(result.length, 1); assert.equal(result[0].quantity, 1);
});

test("UT-CART-02: agregar producto repetido incrementa sin duplicarlo", () => {
  const result = addOrIncrementItem([{ id: "p1", precio: 8, stock: 5, quantity: 1 }], { id: "p1", precio: 8, stock: 5 }); assert.equal(result.length, 1); assert.equal(result[0].quantity, 2);
});

test("UT-CART-03: agregar promoción conserva identificador, composición y precio", () => {
  const promotion = { id: "promo-1", promotionId: "promo-1", kind: "BUNDLE", products: [{ id: "p1", quantity: 2 }, { id: "p2", quantity: 1 }], precio: 20, stock: 3 };
  const [result] = addOrIncrementItem([], promotion); assert.equal(result.promotionId, "promo-1"); assert.deepEqual(result.products, promotion.products); assert.equal(result.precio, 20);
});

test("UT-CART-04: incrementar cantidad respeta el stock", () => {
  const result = addOrIncrementItem([{ id: "p1", precio: 8, stock: 2, quantity: 2 }], { id: "p1", precio: 8, stock: 2 }); assert.equal(result[0].quantity, 2); assert.equal(setItemQuantity(result, "p1", 99)[0].quantity, 2);
});

test("UT-CART-05: reducir y eliminar una línea recalcula la colección", () => {
  const reduced = setItemQuantity([{ id: "p1", quantity: 3, stock: 5 }], "p1", 1); assert.equal(reduced[0].quantity, 1); assert.deepEqual(removeItemById(reduced, "p1"), []);
});

test("UT-CART-06: calcula subtotal y total con cantidades", () => {
  assert.equal(calculateCartTotal([{ precio: 8.5, quantity: 2 }, { precio: 3, quantity: 1 }]), 20);
});

test("UT-CART-07: persiste, recupera y notifica cambios del carrito", () => {
  const browser = installBrowserStorage(); const items = [{ id: "p1", precio: 8, quantity: 2 }]; writeCart(items); assert.deepEqual(readCart(), items); assert.deepEqual(browser.events, ["elpoblano:cart-updated"]); deleteCart(); assert.deepEqual(readCart(), []);
});

test("UT-CART-08: almacenamiento corrupto se recupera como carrito vacío", () => {
  installBrowserStorage({ cart: "{json-inválido" }); assert.deepEqual(readCart(), []);
});
