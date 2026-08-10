import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ProductForm from "../src/modules/admin/components/ProductForm";
import ProductTable from "../src/modules/admin/components/ProductTable";

vi.mock("../src/modules/admin/infrastructure/adminApi", () => ({
  listCategories: vi.fn().mockResolvedValue([{ id: "cat-1", nombre: "Tacos" }]),
}));

describe("gestión visual de productos", () => {
  it("carga categorías y envía el formulario", async () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onChange = vi.fn();
    render(<ProductForm values={{ nombre: "Taco", descripcion: "Birria", categoriaId: "cat-1", precio: 10, stock: 2, activo: true }} onChange={onChange} onImageChange={vi.fn()} onSubmit={onSubmit} />);

    expect(await screen.findByRole("option", { name: "Tacos" })).toBeInTheDocument();
    expect(screen.getByLabelText("Disponible para la venta")).toBeChecked();
    fireEvent.submit(screen.getByRole("button", { name: /guardar producto/i }).closest("form"));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("presenta carga, vacío, stock agotado y eliminación", async () => {
    const onDelete = vi.fn();
    const { rerender } = render(<MemoryRouter><ProductTable products={[]} loading onDelete={onDelete} /></MemoryRouter>);
    expect(screen.getByText("Cargando inventario...")).toBeInTheDocument();

    rerender(<MemoryRouter><ProductTable products={[]} loading={false} onDelete={onDelete} /></MemoryRouter>);
    expect(screen.getByText("No se encontraron productos.")).toBeInTheDocument();

    const product = { id: "p1", nombre: "Taco", categoria: "Tacos", descripcion: "Pastor", precio: 8, stock: 0 };
    rerender(<MemoryRouter><ProductTable products={[product]} loading={false} onDelete={onDelete} /></MemoryRouter>);
    expect(screen.getByText("Agotado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retirar Taco" }));
    expect(onDelete).toHaveBeenCalledWith("p1");

    fireEvent.change(screen.getByPlaceholderText("Buscar producto..."), { target: { value: "quesadilla" } });
    await waitFor(() => expect(screen.getByText("No se encontraron productos.")).toBeInTheDocument());
  });
});
