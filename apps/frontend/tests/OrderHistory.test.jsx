import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrderHistoryPage from "../src/modules/orders/pages/OrderHistoryPage.jsx";
import { getMonthlyOrderHistory } from "../src/modules/orders/infrastructure/orderApi.js";

const auth = vi.hoisted(() => ({ value: { user: { id: "u1" }, loading: false } }));
vi.mock("../src/modules/auth/application/AuthContext.jsx", () => ({ useAuth: () => auth.value }));
vi.mock("../src/modules/orders/infrastructure/orderApi.js", () => ({ getMonthlyOrderHistory: vi.fn() }));

const renderPage = () => render(<MemoryRouter initialEntries={["/historial"]}><OrderHistoryPage /></MemoryRouter>);

describe("historial mensual de compras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.value = { user: { id: "u1" }, loading: false };
  });

  it("UT-FE-38: agrupa pedidos entregados y conserva sus importes y promociones", async () => {
    getMonthlyOrderHistory.mockResolvedValue([{
      month: "2026-08", orderCount: 1, totalSpent: 25,
      orders: [{
        id: "abcdef12-3456", createdAt: "2026-08-10T12:00:00Z", total: 25,
        deliveryAddress: "Av. Principal 123",
        items: [{ id: 1, quantity: 2, productName: "Taco", promotionName: "Combo", subtotal: 25 }],
      }],
    }]);
    renderPage();
    expect(await screen.findByText(/agosto de 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/1 compra entregada/i)).toBeInTheDocument();
    expect(screen.getByText("Combo")).toBeInTheDocument();
    expect(screen.getByText(/Av. Principal 123/)).toBeInTheDocument();
  });

  it("UT-FE-39: representa historial vacío y errores de consulta", async () => {
    getMonthlyOrderHistory.mockResolvedValueOnce([]);
    const view = renderPage();
    expect(await screen.findByText(/aún no tienes pedidos entregados/i)).toBeInTheDocument();
    view.unmount();
    getMonthlyOrderHistory.mockRejectedValueOnce(new Error("Historial no disponible"));
    renderPage();
    expect(await screen.findByText("Historial no disponible")).toBeInTheDocument();
  });

  it("UT-FE-40: espera la sesión y redirige visitantes", () => {
    auth.value = { user: null, loading: true };
    const view = renderPage();
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    view.unmount();
    auth.value = { user: null, loading: false };
    renderPage();
    expect(getMonthlyOrderHistory).not.toHaveBeenCalled();
  });
});
