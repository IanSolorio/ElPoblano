import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Promotions from "../src/modules/home/components/Promotions";
import { listActivePromotions } from "../src/modules/promotions/application/promotionService";
import { addCartItem } from "../src/modules/cart/application/cartService";

vi.mock("../src/modules/promotions/application/promotionService", () => ({ listActivePromotions: vi.fn() }));
vi.mock("../src/modules/cart/application/cartService", () => ({ addCartItem: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("promociones públicas", () => {
  beforeEach(() => listActivePromotions.mockResolvedValue([]));

  it("presenta estado vacío", async () => {
    render(<MemoryRouter><Promotions /></MemoryRouter>);
    expect(screen.getByLabelText("Cargando promociones")).toBeInTheDocument();
    expect(await screen.findByText("Muy pronto habrá nuevas promociones")).toBeInTheDocument();
  });

  it("convierte descuentos y combos en tarjetas comprables", async () => {
    listActivePromotions.mockResolvedValueOnce([
      { id: "pr1", kind: "PRODUCT_DISCOUNT", name: "Oferta", products: [{ id: "p1", nombre: "Taco", precio: 10, precioPromocional: 8, imagen: "t.jpg", stock: 3 }] },
      { id: "pr2", kind: "BUNDLE", name: "Combo", description: "Dos sabores", bundlePrice: 15, imageUrl: "c.jpg", products: [{ id: "p1", nombre: "Taco", precio: 10, stock: 4, quantity: 2 }, { id: "p2", nombre: "Agua", precio: 3, stock: 8, quantity: 1 }] },
    ]);
    render(<MemoryRouter><Promotions /></MemoryRouter>);
    expect(await screen.findAllByText("Taco")).not.toHaveLength(0);
    expect(screen.getAllByText("Combo").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: /agregar/i })[0]);
    expect(addCartItem).toHaveBeenCalledWith(expect.objectContaining({ promotionId: "pr1", precio: 8 }));
  });

  it("controla fallos de carga", async () => {
    listActivePromotions.mockRejectedValueOnce(new Error("fallo"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<MemoryRouter><Promotions /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("Muy pronto habrá nuevas promociones")).toBeInTheDocument());
  });
});
