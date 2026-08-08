import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AdminLayout from "../components/AdminLayout";
import ProductForm from "../components/ProductForm";
import { createProduct, uploadProductImage } from "../../catalog/application/productService";

const initialValues = { nombre: "", descripcion: "", categoriaId: "", precio: "", stock: 0, activo: true, imagen: null };

export default function CreateProductPage() {
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const navigate = useNavigate();
  const onChange = (event) => { const { name, value, type, checked } = event.target; setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value })); };
  const onImageChange = (event) => setValues((current) => ({ ...current, imagen: event.target.files[0] }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (values.imagen) {
        setSubmitStatus("Optimizando y subiendo imagen...");
        imageUrl = await uploadProductImage(values.imagen, (progress) => setSubmitStatus(`Subiendo imagen: ${progress}%`));
      }
      setSubmitStatus("Guardando producto...");
      await createProduct({ ...values, imagen: imageUrl });
      await Swal.fire("Producto creado", "Ya forma parte del inventario.", "success");
      navigate("/admin");
    } catch (error) {
      console.error("Error al crear el producto:", error);
      Swal.fire("Error", error.message || "No se pudo crear el producto", "error");
    } finally { setIsSubmitting(false); setSubmitStatus(""); }
  };

  return <AdminLayout eyebrow="Inventario" title="Crear producto" description="Agrega un nuevo elemento a la carta y define su disponibilidad."><ProductForm values={values} onChange={onChange} onImageChange={onImageChange} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={submitStatus} /></AdminLayout>;
}
