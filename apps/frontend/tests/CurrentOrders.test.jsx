import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CurrentOrdersPage from "../src/modules/orders/pages/CurrentOrdersPage";
import { cancelPendingOrder, getCurrentOrders } from "../src/modules/orders/infrastructure/orderApi";

const auth = vi.hoisted(() => ({ value: { user: { id: "u1", email: "u@test.com" }, loading: false } }));
vi.mock("../src/modules/auth/application/AuthContext", () => ({ useAuth: () => auth.value }));
vi.mock("../src/modules/orders/infrastructure/orderApi", () => ({ getCurrentOrders: vi.fn(), cancelPendingOrder: vi.fn() }));
vi.mock("../src/modules/payments/components/MercadoPagoPayment", () => ({ default: ({ onApproved }) => <button type="button" onClick={onApproved}>Simular pago</button> }));

const base = {
  id: "abcdef12-resto", userId: "u1", createdAt: "2026-08-10T10:00:00Z", total: 10, deliveryAddress: "Lima",
  items: [{ id: 1, productName: "Taco", quantity: 1, subtotal: 10 }], payment: { status: "PENDING" },
};

describe("seguimiento de pedidos", () => {
  beforeEach(() => {
    auth.value = { user: { id: "u1", email: "u@test.com" }, loading: false };
    getCurrentOrders.mockResolvedValue([]);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("muestra estado vacío", async () => {
    render(<MemoryRouter><CurrentOrdersPage /></MemoryRouter>);
    expect(await screen.findByText("No tienes pedidos en curso")).toBeInTheDocument();
  });

  it("permite pagar y cancelar un pedido pendiente", async () => {
    getCurrentOrders.mockResolvedValueOnce([{ ...base, status: "PENDING" }]).mockResolvedValue([]);
    cancelPendingOrder.mockResolvedValue({});
    render(<MemoryRouter><CurrentOrdersPage /></MemoryRouter>);
    expect(await screen.findByText("Pago pendiente")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /pagar pedido/i }));
    expect(screen.getByText("Completa el pago")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Simular pago" }));

    getCurrentOrders.mockResolvedValueOnce([{ ...base, status: "PENDING" }]).mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: /actualizar/i }));
    await screen.findByText("Pago pendiente");
    fireEvent.click(screen.getByRole("button", { name: /cancelar pedido/i }));
    await waitFor(() => expect(cancelPendingOrder).toHaveBeenCalledWith(base.id));
  });

  it("representa el avance de un pedido confirmado", async () => {
    getCurrentOrders.mockResolvedValueOnce([{ ...base, status: "PREPARING", payment: { status: "APPROVED" } }]);
    render(<MemoryRouter><CurrentOrdersPage /></MemoryRouter>);
    expect(await screen.findByText("Preparando")).toBeInTheDocument();
    expect(screen.getByText("Recibimos tu pago")).toBeInTheDocument();
  });
});
