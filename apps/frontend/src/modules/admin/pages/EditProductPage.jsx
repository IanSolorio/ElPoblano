import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import AdminLayout from "../components/AdminLayout";
import ProductForm from "../components/ProductForm";
import { getProduct, updateProduct, uploadProductImage } from "../../catalog/application/productService";

export default function EditProductPage() {
  const [values, setValues] = useState({ nombre: "", descripcion: "", categoriaId: "", precio: 0, stock: 0, activo: true, imagen: "" });
  const [newImage, setNewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => { getProduct(id).then(setValues).catch((error) => { console.error(error); Swal.fire("Error", "No se pudo cargar el producto.", "error"); }); }, [id]);
  const onChange = (event) => { const { name, value, type, checked } = event.target; setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value })); };

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = values.imagen;
      if (newImage) { setStatus("Subiendo nueva imagen..."); imageUrl = await uploadProductImage(newImage, (progress) => setStatus(`Subiendo imagen: ${progress}%`)); }
      setStatus("Actualizando producto...");
      await updateProduct(id, { ...values, imagen: imageUrl });
      await Swal.fire("Producto actualizado", "Los cambios se guardaron correctamente.", "success");
      navigate("/admin");
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      Swal.fire("Error", error.message || "No se pudo actualizar el producto.", "error");
    } finally { setIsSubmitting(false); setStatus(""); }
  };

  return <AdminLayout eyebrow="Inventario" title="Editar producto" description="Actualiza la información comercial y las existencias."><ProductForm values={values} onChange={onChange} onImageChange={(event) => setNewImage(event.target.files[0])} onSubmit={onSubmit} isSubmitting={isSubmitting} submitStatus={status} /></AdminLayout>;
}
