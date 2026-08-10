import { Navigate, Routes, Route } from "react-router-dom";
import Navbar from "../shared/components/Navbar";
import Footer from "../shared/components/Footer";
import Hero from "../modules/home/components/Hero";
import ContactPage from "../modules/contact/pages/ContactPage";
import Promotions from "../modules/home/components/Promotions";
import HomeContent from "../modules/home/components/HomeContent";
import AdminPage from "../modules/admin/pages/AdminPage";
import AboutPage from "../modules/about/pages/AboutPage";
import EditProductPage from "../modules/admin/pages/EditProductPage";
import CreateProductPage from "../modules/admin/pages/CreateProductPage";
import LocationPage from "../modules/location/pages/LocationPage";
import ProductCatalogPage from "../modules/catalog/pages/ProductCatalogPage";
import ProtectedAdminRoute from "../modules/admin/components/ProtectedAdminRoute";
import PromotionsAdminPage from "../modules/admin/pages/PromotionsAdminPage";
import UsersAdminPage from "../modules/admin/pages/UsersAdminPage";
import CategoriesAdminPage from "../modules/admin/pages/CategoriesAdminPage";
import OrdersAdminPage from "../modules/admin/pages/OrdersAdminPage";
import StatisticsAdminPage from "../modules/admin/pages/StatisticsAdminPage";
import RegisterPage from "../modules/auth/pages/RegisterPage";
import CheckoutPage from "../modules/orders/pages/CheckoutPage";
import OrderHistoryPage from "../modules/orders/pages/OrderHistoryPage";
import CurrentOrdersPage from "../modules/orders/pages/CurrentOrdersPage";
import AcademicNotice from "../shared/components/AcademicNotice";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function App() {


  return (
    <>
      <AcademicNotice />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Hero />
              <Promotions />
              <HomeContent />
              <Footer />
            </>
          }
        />
        <Route path="/registro" element={<><Navbar /><RegisterPage /><Footer /></>} />
        <Route path="/checkout" element={<><Navbar /><CheckoutPage /><Footer /></>} />
        <Route path="/historial" element={<><Navbar /><OrderHistoryPage /><Footer /></>} />
        <Route path="/mis-pedidos" element={<><Navbar /><CurrentOrdersPage /><Footer /></>} />
        <Route
          path="/productos"
          element={
            <>
              <Navbar />
              <ProductCatalogPage />
              <Footer />
            </>
          }
        />
        <Route
          path="/nosotros"
          element={
            <>
              <Navbar />
              <AboutPage />
              <Footer />
            </>
          }
        />
        <Route
          path="/ubicanos"
          element={
            <>
              <Navbar />
              <LocationPage />
              <Footer />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <ContactPage />
              <Footer />
            </>
          }
        />

        {/* Ruta para AdminPanel */}
        <Route path="/admin" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>} />
        <Route path="/crearproducto" element={<ProtectedAdminRoute><CreateProductPage /></ProtectedAdminRoute>} />
        <Route path="/editarproducto/:id" element={<ProtectedAdminRoute><EditProductPage /></ProtectedAdminRoute>} />
        <Route path="/admin/promociones" element={<ProtectedAdminRoute><PromotionsAdminPage /></ProtectedAdminRoute>} />
        <Route path="/admin/pedidos" element={<ProtectedAdminRoute><OrdersAdminPage /></ProtectedAdminRoute>} />
        <Route path="/admin/estadisticas" element={<ProtectedAdminRoute><StatisticsAdminPage /></ProtectedAdminRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedAdminRoute><UsersAdminPage /></ProtectedAdminRoute>} />
        <Route path="/admin/categorias" element={<ProtectedAdminRoute allowedRoles={["SUPER_ADMIN"]}><CategoriesAdminPage /></ProtectedAdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
