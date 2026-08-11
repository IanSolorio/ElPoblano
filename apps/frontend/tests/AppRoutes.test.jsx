import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../src/app/App.jsx";

vi.mock("../src/shared/components/AcademicNotice.jsx", () => ({ default: () => <div>Aviso académico</div> }));
vi.mock("../src/shared/components/Navbar.jsx", () => ({ default: () => <div>Navegación</div> }));
vi.mock("../src/shared/components/Footer.jsx", () => ({ default: () => <div>Pie</div> }));
vi.mock("../src/modules/home/components/Hero.jsx", () => ({ default: () => <div>Hero</div> }));
vi.mock("../src/modules/home/components/Promotions.jsx", () => ({ default: () => <div>Promociones</div> }));
vi.mock("../src/modules/home/components/HomeContent.jsx", () => ({ default: () => <div>Inicio</div> }));
vi.mock("../src/modules/contact/pages/ContactPage.jsx", () => ({ default: () => <div>Contacto</div> }));
vi.mock("../src/modules/about/pages/AboutPage.jsx", () => ({ default: () => <div>Nosotros</div> }));
vi.mock("../src/modules/location/pages/LocationPage.jsx", () => ({ default: () => <div>Ubicación</div> }));
vi.mock("../src/modules/catalog/pages/ProductCatalogPage.jsx", () => ({ default: () => <div>Catálogo</div> }));
vi.mock("../src/modules/auth/pages/RegisterPage.jsx", () => ({ default: () => <div>Registro</div> }));
vi.mock("../src/modules/orders/pages/CheckoutPage.jsx", () => ({ default: () => <div>Checkout</div> }));
vi.mock("../src/modules/orders/pages/OrderHistoryPage.jsx", () => ({ default: () => <div>Historial</div> }));
vi.mock("../src/modules/orders/pages/CurrentOrdersPage.jsx", () => ({ default: () => <div>Pedidos actuales</div> }));
vi.mock("../src/modules/admin/pages/AdminPage.jsx", () => ({ default: () => <div>Panel</div> }));
vi.mock("../src/modules/admin/pages/CreateProductPage.jsx", () => ({ default: () => <div>Crear producto</div> }));
vi.mock("../src/modules/admin/pages/EditProductPage.jsx", () => ({ default: () => <div>Editar producto</div> }));
vi.mock("../src/modules/admin/pages/PromotionsAdminPage.jsx", () => ({ default: () => <div>Administrar promociones</div> }));
vi.mock("../src/modules/admin/pages/UsersAdminPage.jsx", () => ({ default: () => <div>Administrar usuarios</div> }));
vi.mock("../src/modules/admin/pages/CategoriesAdminPage.jsx", () => ({ default: () => <div>Administrar categorías</div> }));
vi.mock("../src/modules/admin/pages/OrdersAdminPage.jsx", () => ({ default: () => <div>Administrar pedidos</div> }));
vi.mock("../src/modules/admin/pages/StatisticsAdminPage.jsx", () => ({ default: () => <div>Estadísticas</div> }));
vi.mock("../src/modules/admin/components/ProtectedAdminRoute.jsx", () => ({
  default: ({ children, allowedRoles }) => <section data-roles={allowedRoles?.join(",") || "ADMIN,SUPER_ADMIN"}>{children}</section>,
}));

const renderRoute = (path) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe("contrato de rutas de la aplicación", () => {
  it("UT-FE-32: expone las páginas públicas y redirige rutas desconocidas", () => {
    const cases = [
      ["/", "Inicio"], ["/registro", "Registro"], ["/checkout", "Checkout"],
      ["/historial", "Historial"], ["/mis-pedidos", "Pedidos actuales"],
      ["/productos", "Catálogo"], ["/nosotros", "Nosotros"],
      ["/ubicanos", "Ubicación"], ["/contact", "Contacto"], ["/inexistente", "Inicio"],
    ];
    for (const [path, expected] of cases) {
      const view = renderRoute(path);
      expect(screen.getByText(expected)).toBeInTheDocument();
      expect(screen.getByText("Aviso académico")).toBeInTheDocument();
      view.unmount();
    }
  });

  it("UT-FE-33: protege todas las páginas administrativas y restringe categorías", () => {
    const cases = [
      ["/admin", "Panel"], ["/crearproducto", "Crear producto"],
      ["/editarproducto/123", "Editar producto"], ["/admin/promociones", "Administrar promociones"],
      ["/admin/pedidos", "Administrar pedidos"], ["/admin/estadisticas", "Estadísticas"],
      ["/admin/usuarios", "Administrar usuarios"], ["/admin/categorias", "Administrar categorías"],
    ];
    for (const [path, expected] of cases) {
      const view = renderRoute(path);
      const content = screen.getByText(expected);
      expect(content.closest("section")).toBeInTheDocument();
      if (path === "/admin/categorias") expect(content.closest("section")).toHaveAttribute("data-roles", "SUPER_ADMIN");
      view.unmount();
    }
  });
});
