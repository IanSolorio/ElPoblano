import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "../src/modules/auth/pages/RegisterPage";
import CheckoutPage from "../src/modules/orders/pages/CheckoutPage";
import CategoriesAdminPage from "../src/modules/admin/pages/CategoriesAdminPage";
import CartButton from "../src/modules/cart/components/CartButton";
import { createCategory, listAdminCategories, updateCategory } from "../src/modules/admin/infrastructure/adminApi";
import { createOrder } from "../src/modules/orders/infrastructure/orderApi";

const state = vi.hoisted(() => ({ auth: { user: null, loading: false, register: vi.fn() }, cart: [] }));
vi.mock("../src/modules/auth/application/AuthContext", () => ({ useAuth: () => state.auth }));
vi.mock("../src/modules/auth/components/AddressMap", () => ({ default: ({ onChange }) => <button type="button" onClick={() => onChange([-12, -69])}>Marcar ubicación</button> }));
vi.mock("../src/modules/cart/application/cartService", () => ({
  getCart: () => state.cart,
  getCartTotal: (items) => items.reduce((sum, item) => sum + Number(item.precio) * (item.quantity || 1), 0),
  clearCart: vi.fn(),
}));
vi.mock("../src/modules/orders/infrastructure/orderApi", () => ({ createOrder: vi.fn() }));
vi.mock("../src/modules/payments/components/MercadoPagoPayment", () => ({ default: ({ onApproved }) => <button type="button" onClick={() => onApproved({ id: "paid" })}>Aprobar pago</button> }));
vi.mock("../src/modules/admin/components/AdminLayout", () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock("../src/modules/admin/infrastructure/adminApi", () => ({ createCategory: vi.fn(), listAdminCategories: vi.fn(), updateCategory: vi.fn() }));

describe("flujos complementarios", () => {
  beforeEach(() => {
    state.auth = { user: null, loading: false, register: vi.fn().mockResolvedValue({}) };
    state.cart = [];
    listAdminCategories.mockResolvedValue([{ id: "c1", nombre: "Tacos", activo: true }]);
  });

  it("valida ubicación y registra una cuenta", async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    fireEvent.submit(screen.getByRole("button", { name: "Crear cuenta" }).closest("form"));
    expect(screen.getByRole("alert")).toHaveTextContent("punto exacto");
    fireEvent.click(screen.getByRole("button", { name: "Marcar ubicación" }));
    const fields = { Nombres: "Ana", Apellidos: "Pérez", "Correo electrónico": "ana@test.com", Teléfono: "999999999", Contraseña: "ClaveSegura1", Dirección: "Av. Principal" };
    for (const [label, value] of Object.entries(fields)) fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    await waitFor(() => expect(state.auth.register).toHaveBeenCalledWith(expect.objectContaining({ email: "ana@test.com", address: expect.objectContaining({ latitude: -12 }) })));
  });

  it("crea un pedido y presenta el medio de pago", async () => {
    state.auth = { user: { id: "u1", phone: "999", addresses: [{ id: "a1", label: "Casa", addressLine: "Lima", isDefault: true }] }, loading: false };
    state.cart = [{ id: "p1", nombre: "Taco", precio: 10, quantity: 1 }];
    createOrder.mockResolvedValue({ id: "o1", total: 10 });
    render(<MemoryRouter><CheckoutPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Indicaciones"), { target: { value: "Sin cebolla" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));
    expect(await screen.findByText("Pagar pedido")).toBeInTheDocument();
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ addressId: "a1", notes: "Sin cebolla" }), expect.any(String));
  });

  it("crea y desactiva categorías", async () => {
    createCategory.mockResolvedValue({});
    updateCategory.mockResolvedValue({});
    render(<CategoriesAdminPage />);
    expect(await screen.findByText("Tacos")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Postres" } });
    fireEvent.click(screen.getByRole("button", { name: /agregar categoría/i }));
    await waitFor(() => expect(createCategory).toHaveBeenCalledWith("Postres"));
    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    await waitFor(() => expect(updateCategory).toHaveBeenCalledWith("c1", { activo: false }));
  });

  it("actualiza el contador del carrito", () => {
    state.cart = [{ id: "p1", quantity: 2 }];
    const toggle = vi.fn();
    render(<CartButton toggleCart={toggle} />);
    fireEvent.click(screen.getByRole("button", { name: /abrir carrito, 2 productos/i }));
    expect(toggle).toHaveBeenCalledWith(true);
  });
});
