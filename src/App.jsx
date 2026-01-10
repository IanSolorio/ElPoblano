import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Presentacion from "./components/Presentacion";
import Contact from "./pages/Contactanos";
import Promotions from "./components/Promociones";
import Content from "./components/Content";
import AdminPanel from "./views/AdminPanel";
import Conocenos from "./pages/Conocenos";
import EditProductView from "./views/EditProducto";
import CreateProductView from "./views/CreateProductView";
import Ubicanos from "./pages/Ubicanos";
import Producto from "./pages/Producto";
import Carrito from "./components/Carrito";
import CartButton from "./components/CartButton"; 
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function App() {


  return (
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Presentacion />
              <Promotions />
              <Content />
              <Footer />
            </>
          }
        />
        <Route
          path="/productos"
          element={
            <>
              <Navbar />
              <Producto />
              <Footer />
            </>
          }
        />
        <Route
          path="/nosotros"
          element={
            <>
              <Navbar />
              <Conocenos />
              <Footer />
            </>
          }
        />
        <Route
          path="/ubicanos"
          element={
            <>
              <Navbar />
              <Ubicanos />
              <Footer />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <Contact />
              <Footer />
            </>
          }
        />

        {/* Ruta para AdminPanel */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/crearproducto" element={<CreateProductView />}></Route>
        <Route path="/editarproducto/:id" element={<EditProductView />}></Route>
      </Routes>
  );
}

export default App;
