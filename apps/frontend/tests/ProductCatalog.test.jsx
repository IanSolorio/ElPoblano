import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductCatalogPage from "../src/modules/catalog/pages/ProductCatalogPage";
import { listProducts } from "../src/modules/catalog/application/productService";
import { getCategorias } from "../src/modules/catalog/infrastructure/productApi";
import { addCartItem } from "../src/modules/cart/application/cartService";

vi.mock("../src/modules/catalog/application/productService", () => ({ listProducts: vi.fn() }));
vi.mock("../src/modules/catalog/infrastructure/productApi", () => ({ getCategorias: vi.fn() }));
vi.mock("../src/modules/cart/application/cartService", () => ({ addCartItem: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const products = [
  { id: "p1", nombre: "Taco pastor", categoria: "Tacos", descripcion: "Con piña", precio: 10, stock: 4, imagen: "taco.jpg" },
  { id: "p2", nombre: "Agua", categoria: "Agua", descripcion: "Fría", precio: 3, stock: 8, imagen: null },
];

describe("catálogo público", () => {
  beforeEach(() => {
    listProducts.mockResolvedValue(products);
    getCategorias.mockResolvedValue([{ nombre: "Tacos" }, { nombre: "Agua" }]);
  });

  it("carga, filtra, limpia y agrega productos", async () => {
    render(<ProductCatalogPage />);
    expect(screen.getByText("Preparando la carta...")).toBeInTheDocument();
    expect(await screen.findByText("Taco pastor")).toBeInTheDocument();
    expect(screen.getAllByText("Agua").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText(/buscar tacos/i), { target: { value: "pastor" } });
    expect(screen.queryByText("Fría")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(addCartItem).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }));

    fireEvent.change(screen.getByPlaceholderText(/buscar tacos/i), { target: { value: "inexistente" } });
    expect(screen.getByText("No encontramos coincidencias")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar toda la carta" }));
    expect(await screen.findByText("Taco pastor")).toBeInTheDocument();
  });

  it("muestra un error controlado cuando falla la API", async () => {
    listProducts.mockRejectedValueOnce(new Error("sin conexión"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ProductCatalogPage />);
    await waitFor(() => expect(screen.getByText("No pudimos cargar la carta")).toBeInTheDocument());
  });
});
