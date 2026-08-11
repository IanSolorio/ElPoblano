import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock("../src/modules/catalog/infrastructure/imageStorage.js", async (loadOriginal) => {
  const original = await loadOriginal();
  return { ...original, deleteFile: vi.fn(), uploadFile: vi.fn() };
});

import * as authApi from "../src/modules/auth/infrastructure/authApi.js";
import * as orderApi from "../src/modules/orders/infrastructure/orderApi.js";
import {
  addOrIncrementItem,
  calculateCartTotal,
  removeItemById,
  setItemQuantity,
} from "../src/modules/cart/domain/cart.js";
import { readCart, writeCart } from "../src/modules/cart/infrastructure/cartStorage.js";
import * as cartService from "../src/modules/cart/application/cartService.js";
import * as productApi from "../src/modules/catalog/infrastructure/productApi.js";
import * as productService from "../src/modules/catalog/application/productService.js";
import { deleteFile, uploadFile } from "../src/modules/catalog/infrastructure/imageStorage.js";
import { normalizeProduct, normalizeProducts } from "../src/modules/catalog/domain/product.js";
import { fetchActivePromotions } from "../src/modules/promotions/infrastructure/promotionApi.js";
import { listActivePromotions } from "../src/modules/promotions/application/promotionService.js";

const okJson = (data, status = 200) => ({ ok: true, status, json: async () => data });

describe("servicios críticos del frontend", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("UT-FE-23: conserva las reglas del carrito y sincroniza su almacenamiento", () => {
    const taco = { id: "taco", precio: "8.50", stock: 2 };
    expect(calculateCartTotal([{ ...taco, quantity: 2 }])).toBe(17);
    expect(addOrIncrementItem([], taco)).toEqual([{ ...taco, quantity: 1 }]);
    expect(addOrIncrementItem([{ ...taco, precio: 9, quantity: 1 }], taco)[0]).toMatchObject({ precio: 8.5, quantity: 2 });
    expect(addOrIncrementItem([{ ...taco, quantity: 2 }], taco)[0].quantity).toBe(2);
    expect(setItemQuantity([{ ...taco, quantity: 1 }], "taco", 99)[0].quantity).toBe(2);
    expect(setItemQuantity([{ ...taco, quantity: 2 }], "taco", 0)[0].quantity).toBe(1);
    expect(removeItemById([taco], "taco")).toEqual([]);

    const listener = vi.fn();
    window.addEventListener("elpoblano:cart-updated", listener);
    writeCart([{ ...taco, quantity: 1 }, { ...taco, quantity: 2 }]);
    expect(readCart()).toEqual([{ ...taco, quantity: 3 }]);
    expect(cartService.getCartTotal()).toBe(25.5);
    cartService.addCartItem(taco);
    cartService.updateCartItemQuantity("taco", 1);
    cartService.removeCartItem("taco");
    cartService.clearCart();
    expect(cartService.getCart()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(5);
    localStorage.setItem("cart", "JSON inválido");
    expect(readCart()).toEqual([]);
  });

  it("UT-FE-24: construye correctamente las solicitudes de autenticación y pedidos", async () => {
    fetch
      .mockResolvedValueOnce(okJson({ user: { id: 1 } }))
      .mockResolvedValueOnce(okJson({ user: { id: 2 } }, 201))
      .mockResolvedValueOnce({ ok: true, status: 204 })
      .mockResolvedValueOnce(okJson({ id: 1 }))
      .mockResolvedValueOnce(okJson({ id: "pedido" }, 201))
      .mockResolvedValue(okJson([]));

    await authApi.login({ email: "cliente@example.com", password: "secreto" });
    await authApi.register({ email: "nuevo@example.com" });
    await authApi.logout();
    await authApi.getCurrentUser();
    await orderApi.createOrder({ items: [] }, "clave-1");
    await orderApi.getOrderHistory();
    await orderApi.getCurrentOrders();
    await orderApi.cancelPendingOrder("pedido-1");
    await orderApi.getMonthlyOrderHistory();
    await orderApi.processMercadoPagoPayment("pedido-1", { token: "tok" }, "pago-1");

    expect(fetch).toHaveBeenCalledTimes(10);
    expect(fetch.mock.calls[4][1].headers["Idempotency-Key"]).toBe("clave-1");
    expect(fetch.mock.calls[7][1].method).toBe("PATCH");
    expect(fetch.mock.calls[9][1]).toMatchObject({ method: "POST", headers: expect.objectContaining({ "Idempotency-Key": "pago-1" }) });

    fetch.mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({ message: "Pedido inválido" }) });
    await expect(orderApi.getCurrentOrders()).rejects.toThrow("Pedido inválido");
    fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    await expect(authApi.getCurrentUser()).rejects.toThrow("No se pudo completar la solicitud");
  });

  it("UT-FE-25: normaliza y ejecuta el ciclo completo de productos y promociones", async () => {
    const product = { id: "p1", precio: "12.50", imagen: "https://storage/producto.webp" };
    axios.get
      .mockResolvedValueOnce({ status: 200, data: [product] })
      .mockResolvedValueOnce({ data: [product] })
      .mockResolvedValueOnce({ data: [{ id: 1, nombre: "Tacos" }] })
      .mockResolvedValueOnce({ status: 200, data: product })
      .mockResolvedValueOnce({ data: product })
      .mockResolvedValueOnce({ data: [{ id: "promo" }] })
      .mockResolvedValueOnce({ data: [{ id: "promo" }] });
    axios.post.mockResolvedValue({ status: 201, data: product });
    axios.put.mockResolvedValue({ status: 200, data: { ...product, precio: 14 } });
    axios.delete.mockResolvedValue({ status: 200, data: { removed: true } });

    expect(normalizeProduct(product).precio).toBe(12.5);
    expect(normalizeProducts([product])[0].precio).toBe(12.5);
    expect((await productApi.getProductos())[0]).toEqual(product);
    expect(await productApi.getProductosAdmin()).toEqual([product]);
    expect(await productApi.getCategorias()).toHaveLength(1);
    expect(await productService.getProduct("p1")).toMatchObject({ precio: 12.5 });
    expect(await productService.createProduct(product)).toEqual(product);
    expect(await productService.updateProduct("p1", product)).toMatchObject({ precio: 14 });
    expect(await productService.deleteProduct("p1")).toEqual({ removed: true });
    expect(deleteFile).toHaveBeenCalledWith(product.imagen);
    expect(await fetchActivePromotions()).toEqual([{ id: "promo" }]);
    expect(await listActivePromotions()).toEqual([{ id: "promo" }]);
    uploadFile.mockResolvedValue("https://storage/nueva.webp");
    await expect(productService.uploadProductImage(new File(["x"], "x.jpg"))).resolves.toBe("https://storage/nueva.webp");
  });

  it("UT-FE-26: propaga respuestas inesperadas y protege el borrado de productos", async () => {
    axios.get.mockResolvedValueOnce({ status: 202, data: [] });
    await expect(productApi.getProductos()).rejects.toThrow("Error al obtener los productos");
    axios.post.mockResolvedValueOnce({ status: 200, data: {} });
    await expect(productApi.postProductos({})).rejects.toThrow("Error al agregar un producto");
    axios.get.mockResolvedValueOnce({ status: 404, data: {} });
    await expect(productApi.getProductoId("ausente")).rejects.toThrow("Error al obtener el producto");
    axios.put.mockResolvedValueOnce({ status: 202, data: {} });
    await expect(productApi.putProductoId("p1", {})).rejects.toThrow("Error al actualizar el producto");

    axios.get.mockResolvedValueOnce({ data: { id: "p1", imagen: "https://storage/x.webp" } });
    deleteFile.mockRejectedValueOnce(new Error("Firebase no disponible"));
    await expect(productApi.deleteProductoId("p1")).rejects.toThrow("Ocurrió un error al intentar eliminar el producto");
    axios.get.mockResolvedValueOnce({ data: { id: "p2", imagen: null } });
    axios.delete.mockResolvedValueOnce({ status: 500, data: {} });
    await expect(productApi.deleteProductoId("p2")).rejects.toThrow("Ocurrió un error al intentar eliminar el producto");
  });
});
