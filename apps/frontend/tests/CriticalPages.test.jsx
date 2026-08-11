import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaymentModal from "../src/modules/cart/pages/PaymentModal.jsx";
import ProductListPage from "../src/modules/admin/pages/ProductListPage.jsx";
import StatisticsAdminPage from "../src/modules/admin/pages/StatisticsAdminPage.jsx";
import { deleteProduct, listAdminProducts } from "../src/modules/catalog/application/productService.js";
import { getAdminOrderStatistics } from "../src/modules/admin/infrastructure/adminApi.js";

const sweetAlert = vi.hoisted(() => vi.fn());
vi.mock("sweetalert2", () => ({ default: { fire: sweetAlert } }));
vi.mock("../src/modules/catalog/application/productService.js", () => ({ listAdminProducts: vi.fn(), deleteProduct: vi.fn() }));
vi.mock("../src/modules/admin/infrastructure/adminApi.js", () => ({ getAdminOrderStatistics: vi.fn() }));
vi.mock("../src/modules/admin/components/ProductTable.jsx", () => ({
  default: ({ products, loading, onDelete }) => <div>
    <span>{loading ? "Cargando tabla" : `Tabla ${products.length}`}</span>
    {products.map((product) => <button key={product.id} onClick={() => onDelete(product.id)}>Retirar {product.nombre}</button>)}
  </div>,
}));
vi.mock("../src/modules/admin/components/AdminLayout.jsx", () => ({
  default: ({ title, actions, children }) => <main><h1>{title}</h1>{actions}{children}</main>,
}));

describe("páginas críticas pendientes de cobertura", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sweetAlert.mockResolvedValue({ isConfirmed: true });
  });

  it("UT-FE-27: valida importes insuficientes y suficientes en el formulario de pago", () => {
    const handleClose = vi.fn();
    const { rerender } = render(<PaymentModal open handleClose={handleClose} productPrice={20} />);
    const amount = screen.getByRole("spinbutton");
    fireEvent.change(amount, { target: { value: "10" } });
    fireEvent.submit(amount.closest("form"));
    expect(sweetAlert).toHaveBeenLastCalledWith(expect.objectContaining({ icon: "error", title: "Compra no completada" }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    rerender(<PaymentModal open handleClose={handleClose} productPrice={20} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "25" } });
    fireEvent.submit(screen.getByRole("spinbutton").closest("form"));
    expect(sweetAlert).toHaveBeenLastCalledWith(expect.objectContaining({ icon: "success", title: "Compra completada" }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(handleClose).toHaveBeenCalledTimes(3);
  });

  it("UT-FE-28: carga el inventario y retira únicamente con confirmación", async () => {
    listAdminProducts.mockResolvedValue([
      { id: "p1", nombre: "Taco", stock: 4 },
      { id: "p2", nombre: "Agua", stock: 0 },
    ]);
    deleteProduct.mockResolvedValue({});
    render(<ProductListPage />);
    expect(await screen.findByText("Tabla 2")).toBeInTheDocument();
    expect(screen.getByText("Con disponibilidad").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Sin existencias").nextSibling).toHaveTextContent("1");

    sweetAlert.mockResolvedValueOnce({ isConfirmed: false });
    fireEvent.click(screen.getByRole("button", { name: /retirar taco/i }));
    await waitFor(() => expect(deleteProduct).not.toHaveBeenCalled());
    sweetAlert.mockResolvedValueOnce({ isConfirmed: true });
    fireEvent.click(screen.getByRole("button", { name: /retirar taco/i }));
    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith("p1"));
    expect(await screen.findByText("Tabla 1")).toBeInTheDocument();
  });

  it("UT-FE-29: informa fallos al cargar y retirar productos", async () => {
    listAdminProducts.mockRejectedValueOnce(new Error("sin red"));
    const { unmount } = render(<ProductListPage />);
    await waitFor(() => expect(sweetAlert).toHaveBeenCalledWith("Error", "No se pudieron cargar los productos", "error"));
    unmount();

    listAdminProducts.mockResolvedValueOnce([{ id: "p1", nombre: "Taco", stock: 1 }]);
    deleteProduct.mockRejectedValueOnce(new Error("protegido"));
    render(<ProductListPage />);
    fireEvent.click(await screen.findByRole("button", { name: /retirar taco/i }));
    await waitFor(() => expect(sweetAlert).toHaveBeenCalledWith("Error", "No se pudo retirar el producto.", "error"));
  });

  it("UT-FE-30: presenta estadísticas, rankings y cambio de periodo", async () => {
    getAdminOrderStatistics.mockResolvedValue({
      summary: { revenue: 40, orders: 2, productsSold: 3, customers: 2, averageTicket: 20 },
      ordersByStatus: { CONFIRMED: 1, DELIVERED: 1 },
      topProducts: [{ productId: "p1", name: "Taco", units: 2, revenue: 20 }],
      topPromotions: [{ promotionId: "pr1", name: "Combo", units: 1, revenue: 20 }],
    });
    render(<StatisticsAdminPage />);
    expect(await screen.findByText("S/ 40.00")).toBeInTheDocument();
    expect(screen.getByText("Taco")).toBeInTheDocument();
    expect(screen.getByText("Combo")).toBeInTheDocument();
    expect(screen.getByText("Confirmados")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/periodo/i), { target: { value: "2026-07" } });
    await waitFor(() => expect(getAdminOrderStatistics).toHaveBeenLastCalledWith("2026-07"));
  });

  it("UT-FE-31: muestra estados vacíos y errores de estadísticas", async () => {
    getAdminOrderStatistics.mockResolvedValueOnce({ summary: {}, ordersByStatus: {}, topProducts: [], topPromotions: [] });
    const { unmount } = render(<StatisticsAdminPage />);
    expect(await screen.findByText("No hay productos vendidos en este periodo.")).toBeInTheDocument();
    expect(screen.getByText("No hay ventas asociadas a promociones en este periodo.")).toBeInTheDocument();
    unmount();
    getAdminOrderStatistics.mockRejectedValueOnce(new Error("No autorizado"));
    render(<StatisticsAdminPage />);
    expect(await screen.findByText("No autorizado")).toBeInTheDocument();
  });
});
