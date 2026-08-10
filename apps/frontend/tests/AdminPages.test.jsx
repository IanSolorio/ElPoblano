import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsersAdminPage from "../src/modules/admin/pages/UsersAdminPage";
import PromotionsAdminPage from "../src/modules/admin/pages/PromotionsAdminPage";
import OrdersAdminPage from "../src/modules/admin/pages/OrdersAdminPage";
import { createAdminUser, createPromotion, listAdminOrders, listAdminPromotions, listAdminUsers, removePromotion, setUserStatus, updateAdminOrderStatus } from "../src/modules/admin/infrastructure/adminApi";
import { listAdminProducts } from "../src/modules/catalog/application/productService";

vi.mock("../src/modules/admin/components/AdminLayout", () => ({ default: ({ children, title, actions }) => <main><h1>{title}</h1>{actions}{children}</main> }));
vi.mock("../src/modules/auth/application/AuthContext", () => ({ useAuth: () => ({ user: { id: "sa", role: "SUPER_ADMIN" } }) }));
vi.mock("../src/modules/catalog/infrastructure/imageStorage", () => ({ uploadFile: vi.fn().mockResolvedValue("combo.jpg") }));
vi.mock("../src/modules/admin/infrastructure/adminApi", () => ({
  createAdminUser: vi.fn(), listAdminUsers: vi.fn(), setUserStatus: vi.fn(),
  createPromotion: vi.fn(), listAdminPromotions: vi.fn(), removePromotion: vi.fn(),
  listAdminOrders: vi.fn(), updateAdminOrderStatus: vi.fn(),
}));
vi.mock("../src/modules/catalog/application/productService", () => ({ listAdminProducts: vi.fn() }));

const order = {
  id: "12345678-abcd", status: "CONFIRMED", customerName: "Ana", customerEmail: "ana@test.com", customerPhone: "999",
  deliveryAddress: "Lima", createdAt: "2026-08-10T10:00:00Z", subtotal: 10, deliveryFee: 0, total: 10,
  payment: { status: "APPROVED", method: "CREDIT_CARD" }, items: [{ id: 1, productName: "Taco", quantity: 1, subtotal: 10 }],
};

describe("panel administrativo", () => {
  beforeEach(() => {
    listAdminUsers.mockResolvedValue({ data: [{ id: "u1", firstName: "Juan", lastName: "Pérez", email: "j@test.com", role: "CUSTOMER", active: true }] });
    listAdminPromotions.mockResolvedValue([]);
    listAdminProducts.mockResolvedValue([{ id: "p1", nombre: "Taco" }, { id: "p2", nombre: "Agua" }]);
    listAdminOrders.mockResolvedValue({ data: [order], summary: { confirmed: 1 }, pagination: { page: 1, pages: 1, total: 1 } });
  });

  it("crea y desactiva cuentas", async () => {
    createAdminUser.mockResolvedValue({});
    setUserStatus.mockResolvedValue({});
    render(<UsersAdminPage />);
    expect(await screen.findByText("Juan Pérez")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));
    await waitFor(() => expect(setUserStatus).toHaveBeenCalledWith("u1", false));
    for (const [label, value] of [["Nombres", "Eva"], ["Apellidos", "Díaz"], ["Correo", "eva@test.com"], ["Contraseña", "ClaveSegura1"]]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));
    await waitFor(() => expect(createAdminUser).toHaveBeenCalled());
  });

  it("crea y retira una promoción individual", async () => {
    createPromotion.mockResolvedValue({});
    removePromotion.mockResolvedValue({});
    const { rerender } = render(<PromotionsAdminPage />);
    expect(await screen.findByText("Taco")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Semana taco" } });
    fireEvent.change(screen.getByLabelText("Inicio"), { target: { value: "2026-08-10T10:00" } });
    fireEvent.change(screen.getByLabelText("Finalización"), { target: { value: "2026-08-11T10:00" } });
    fireEvent.click(screen.getByLabelText("Taco"));
    fireEvent.click(screen.getByRole("button", { name: /crear promoción/i }));
    await waitFor(() => expect(createPromotion).toHaveBeenCalledWith(expect.objectContaining({ name: "Semana taco", products: [{ productId: "p1", quantity: 1 }] })));

    listAdminPromotions.mockResolvedValueOnce([{ id: "pr1", name: "Oferta", kind: "PRODUCT_DISCOUNT", startsAt: "2026-08-10", endsAt: "2026-08-11", discountType: "PERCENTAGE", discountValue: 10, products: [{ nombre: "Taco", quantity: 1 }] }]);
    rerender(<PromotionsAdminPage />);
  });

  it("lista, busca, abre y actualiza pedidos", async () => {
    updateAdminOrderStatus.mockResolvedValue({ ...order, status: "PREPARING" });
    render(<OrdersAdminPage />);
    expect(await screen.findByText("Ana")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar pedidos"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() => expect(listAdminOrders).toHaveBeenCalledWith(expect.objectContaining({ search: "Ana" })));
    fireEvent.click(screen.getByRole("button", { name: /ver/i }));
    expect(screen.getByText("Cliente y entrega")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /iniciar preparación/i }));
    await waitFor(() => expect(updateAdminOrderStatus).toHaveBeenCalledWith(order.id, "PREPARING"));
  });
});
