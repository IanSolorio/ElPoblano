import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "../src/shared/components/Navbar";
import CartDrawer from "../src/modules/cart/components/CartDrawer";
import { removeCartItem, updateCartItemQuantity } from "../src/modules/cart/application/cartService";

const state = vi.hoisted(() => ({ user: null, items: [] }));
vi.mock("../src/modules/auth/application/AuthContext", () => ({ useAuth: () => ({ user: state.user, logout: vi.fn() }) }));
vi.mock("../src/modules/cart/application/cartService", () => ({
  getCart: () => state.items,
  getCartTotal: (items) => items.reduce((sum, item) => sum + Number(item.precio) * (item.quantity || 1), 0),
  removeCartItem: vi.fn(),
  updateCartItemQuantity: vi.fn(),
}));
vi.mock("@mui/material", () => ({ Drawer: ({ children, open }) => open ? <aside>{children}</aside> : null }));
vi.mock("../src/modules/admin/components/LoginModal", () => ({ default: ({ open }) => open ? <div>Modal login</div> : null }));

describe("navegación y carrito", () => {
  beforeEach(() => { state.user = null; state.items = []; });

  it("abre el inicio de sesión y carrito desde la navegación", () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    expect(screen.getByText("Modal login")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /abrir carrito/i }));
    expect(screen.getByText("Tu carrito está esperando")).toBeInTheDocument();
  });

  it("actualiza y elimina productos del carrito", () => {
    state.user = { firstName: "Ana", role: "CUSTOMER" };
    state.items = [{ id: "p1", nombre: "Taco", precio: 10, precioOriginal: 12, quantity: 2, stock: 5 }];
    render(<MemoryRouter><CartDrawer open toggleCart={vi.fn()} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(updateCartItemQuantity).toHaveBeenCalledWith("p1", 3);
    fireEvent.click(screen.getByRole("button", { name: "Reducir cantidad" }));
    expect(updateCartItemQuantity).toHaveBeenCalledWith("p1", 1);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Taco" }));
    expect(removeCartItem).toHaveBeenCalledWith("p1");
    fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));
  });
});
