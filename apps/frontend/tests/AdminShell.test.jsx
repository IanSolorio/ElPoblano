import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "../src/modules/admin/components/AdminLayout.jsx";
import ProtectedAdminRoute from "../src/modules/admin/components/ProtectedAdminRoute.jsx";

const auth = vi.hoisted(() => ({ value: { user: { role: "ADMIN", firstName: "Ana" }, loading: false, logout: vi.fn() } }));
vi.mock("../src/modules/auth/application/AuthContext.jsx", () => ({ useAuth: () => auth.value }));

const renderWithRouter = (element, path = "/admin") => render(
  <MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={element} /></Routes></MemoryRouter>,
);

describe("estructura y autorización administrativa", () => {
  beforeEach(() => {
    auth.value = { user: { role: "ADMIN", firstName: "Ana" }, loading: false, logout: vi.fn().mockResolvedValue() };
  });

  it("UT-FE-41: presenta identidad, navegación y cierre de sesión del administrador", async () => {
    renderWithRouter(<AdminLayout eyebrow="Inventario" title="Productos" description="Gestiona la carta" actions={<button>Crear</button>}><p>Contenido</p></AdminLayout>);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /navegación administrativa/i })).toBeInTheDocument();
    expect(screen.queryByText("Categorías")).not.toBeInTheDocument();
    expect(screen.getByText("Gestiona la carta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: /cerrar sesión/i }));
    await waitFor(() => expect(auth.value.logout).toHaveBeenCalled());
  });

  it("UT-FE-42: habilita categorías exclusivamente para SUPER_ADMIN", () => {
    auth.value = { user: { role: "SUPER_ADMIN", nombre: "Principal" }, loading: false, logout: vi.fn().mockRejectedValue(new Error("red")) };
    renderWithRouter(<AdminLayout eyebrow="Administración" title="Categorías"><p>Contenido</p></AdminLayout>);
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("Administrador principal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /categorías/i })).toHaveAttribute("href", "/admin/categorias");
    fireEvent.click(screen.getByRole("link", { name: /cerrar sesión/i }));
  });

  it("UT-FE-43: espera autenticación, autoriza roles permitidos y redirige accesos inválidos", () => {
    auth.value = { user: null, loading: true, logout: vi.fn() };
    const loading = renderWithRouter(<ProtectedAdminRoute><p>Privado</p></ProtectedAdminRoute>);
    expect(screen.getByText("Validando acceso...")).toBeInTheDocument();
    loading.unmount();

    auth.value = { user: { role: "ADMIN" }, loading: false, logout: vi.fn() };
    const allowed = renderWithRouter(<ProtectedAdminRoute><p>Privado</p></ProtectedAdminRoute>);
    expect(screen.getByText("Privado")).toBeInTheDocument();
    allowed.unmount();

    auth.value = { user: { role: "ADMIN" }, loading: false, logout: vi.fn() };
    renderWithRouter(<><Routes><Route path="/" element={<p>Inicio público</p>} /></Routes><ProtectedAdminRoute allowedRoles={["SUPER_ADMIN"]}><p>Restringido</p></ProtectedAdminRoute></>);
    expect(screen.queryByText("Restringido")).not.toBeInTheDocument();
  });
});
