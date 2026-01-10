import React, { useState } from "react";
import FormProduct from "../components/FormProduct";
import { postProductos } from "../services/ProductoService";
import { uploadFile } from "../services/storageService";
import Swal from "sweetalert2";
import SidebarAdmin from "../components/SidebarAdmin";
import { useNavigate } from "react-router-dom";


const CreateProductView = () => {
  const [formValues, setFormValues] = useState({
    nombre: "",
    descripcion: "",
    categoria: "",
    precio: "",
    imagen: null, // Guardaremos la referencia al archivo seleccionado
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleImageChange = (e) => {
    setFormValues({ ...formValues, imagen: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageUrl = "";
      if (formValues.imagen) {
        // Subir la imagen a Firebase Storage y obtener la URL
        imageUrl = await uploadFile(formValues.imagen);
      }

      // Crear el producto con la URL de la imagen
      await postProductos({
        ...formValues,
        imagen: imageUrl, // Agregar la URL de la imagen
      });

      Swal.fire("Éxito", "Producto creado correctamente", "success");
      
      // Redireccionar a /admin
      navigate("/admin");

      // Reiniciar el formulario
      setFormValues({
        nombre: "",
        descripcion: "",
        categoria: "",
        precio: "",
        imagen: null,
      });
    } catch (error) {
      console.error("Error al crear el producto:", error);
      Swal.fire("Error", "No se pudo crear el producto", "error");
    }
  };

  return (
    <div className="d-flex">
      <SidebarAdmin/>
      <FormProduct
      values={formValues}
      onChange={handleChange}
      onImageChange={handleImageChange}
      onSubmit={handleSubmit}
      title="Crear Producto"
    />
    </div>
  );
};

export default CreateProductView;
