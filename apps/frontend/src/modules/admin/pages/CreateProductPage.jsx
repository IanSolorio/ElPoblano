import React, { useState } from "react";
import ProductForm from "../components/ProductForm";
import { createProduct, uploadProductImage } from "../../catalog/application/productService";
import Swal from "sweetalert2";
import AdminSidebar from "../components/AdminSidebar";
import { useNavigate } from "react-router-dom";


const CreateProductView = () => {
  const [formValues, setFormValues] = useState({
    nombre: "",
    descripcion: "",
    categoriaId: "",
    precio: "",
    stock: 0,
    activo: true,
    imagen: null, // Guardaremos la referencia al archivo seleccionado
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues({ ...formValues, [name]: type === "checkbox" ? checked : value });
  };

  const handleImageChange = (e) => {
    setFormValues({ ...formValues, imagen: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let imageUrl = "";
      if (formValues.imagen) {
        setSubmitStatus("Optimizando y subiendo imagen...");
        imageUrl = await uploadProductImage(formValues.imagen, (progress) => {
          setSubmitStatus(`Subiendo imagen: ${progress}%`);
        });
      }

      setSubmitStatus("Guardando producto...");
      await createProduct({
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
        categoriaId: "",
        precio: "",
        stock: 0,
        activo: true,
        imagen: null,
      });
    } catch (error) {
      console.error("Error al crear el producto:", error);
      Swal.fire("Error", error.message || "No se pudo crear el producto", "error");
    } finally {
      setIsSubmitting(false);
      setSubmitStatus("");
    }
  };

  return (
    <div className="d-flex">
      <AdminSidebar />
      <ProductForm
      values={formValues}
      onChange={handleChange}
      onImageChange={handleImageChange}
      onSubmit={handleSubmit}
      title="Crear Producto"
      isSubmitting={isSubmitting}
      submitStatus={submitStatus}
    />
    </div>
  );
};

export default CreateProductView;
