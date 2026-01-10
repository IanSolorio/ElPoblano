/* eslint-disable react/react-in-jsx-scope */
import { useParams } from "react-router-dom"; // Obtener ID desde la URL
import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProductoId, putProductoId } from "../services/ProductoService"; // Servicios necesarios
import FormProduct from "../components/FormProduct"; // Formulario
import { uploadFile } from "../services/storageService"; // Servicio de subida de archivos
import SidebarAdmin from "../components/SidebarAdmin";
let imagen; // Variable global para manejar la imagen

const EditProductView = () => {
  const [values, setValues] = useState({
    nombre: "",
    descripcion: "",
    categoria: "",
    precio: 0,
    imagen: "https://via.placeholder.com/150",
  });

  const { id } = useParams(); // ID del producto
  const navigate = useNavigate();

  // Maneja los cambios en los inputs del formulario
  const handleValues = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  // Maneja la selección de una nueva imagen
  const handleImage = (e) => {
    imagen = e.target.files[0]; // Almacena la imagen seleccionada
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nombre, descripcion, categoria, precio } = values;

    // Validación básica
    if (!nombre || !descripcion || !categoria || !precio) {
      Swal.fire({
        title: "Error",
        text: "Todos los campos son obligatorios.",
        icon: "error",
      });
      return;
    }

    // Muestra un mensaje de carga
    const loading = Swal.fire({
      title: "Cargando...",
      text: "Actualizando el producto...",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    let urlImagen = values.imagen;

    // Si hay una nueva imagen seleccionada, súbela al storage
    if (imagen) {
      urlImagen = await uploadFile(imagen);
    }

    // Construye el objeto del producto actualizado
    const updateProduct = {
      ...values,
      imagen: urlImagen,
    };

    try {
      await putProductoId(id, updateProduct); // Actualiza el producto
      loading.close();
      Swal.fire({
        title: "Producto Actualizado",
        text: `El producto "${values.nombre}" fue actualizado correctamente.`,
        icon: "success",
      });
      navigate("/admin");
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el producto.",
        icon: "error",
      });
      loading.close();
    }
  };

  // Carga los datos del producto al montar el componente
  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const producto = await getProductoId(id);
        setValues(producto);
      } catch (error) {
        console.error("Error al obtener el producto:", error);
      }
    };
    fetchProducto();
  }, [id]);

  return (
    <div className="d-flex">
      <SidebarAdmin />
      <FormProduct
            values={values}
            onChange={handleValues}
            onImageChange={handleImage}
            onSubmit={handleSubmit}
            title="Editar Producto"
          />
    </div>
  );
};

export default EditProductView;
