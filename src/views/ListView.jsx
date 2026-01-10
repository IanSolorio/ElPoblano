/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2"; // Para manejar alertas de error
import { deleteProductoId, getProductos } from "../services/ProductoService";
import ProductsTable from "../components/ProductTableAdmin";

const ListView = () => {
  const [productos, setProductos] = useState([]); 
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await getProductos(); 
        setProductos(data); // Guarda los productos en el estado
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar los productos", "error");
      }
    };
    fetchProductos();
  }, []); 

  // Eliminacion de un Producto
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás recuperar este producto una vez eliminado.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteProductoId(id); // Llama al servicio para eliminar el producto
        Swal.fire("Eliminado", "El producto ha sido eliminado.", "success");
        // Actualizar la lista de productos
        setProductos((prevProductos) =>
          prevProductos.filter((producto) => producto.id !== id)
        );
      } catch (error) {
        console.error("Error al eliminar el producto:", error);
        Swal.fire("Error", "No se pudo eliminar el producto.", "error");
      }
    }
  };

  return (
    <div>
      <h1>Listado de Productos</h1>
      <ProductsTable productos={productos} handleDelete={handleDelete} /> {/* Pasa los productos a ProductsTable */}
    </div>
  );
};

export default ListView;
