import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddressMap from "../components/AddressMap";
import { useAuth } from "../application/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "", addressLine: "", reference: "" });
  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!position) return setError("Debes marcar el punto exacto de entrega en el mapa.");
    setSaving(true); setError("");
    try {
      await register({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        password: form.password, phone: form.phone,
        address: { label: "Casa", addressLine: form.addressLine, reference: form.reference, latitude: position[0], longitude: position[1] },
      });
      navigate("/productos");
    } catch (registrationError) { setError(registrationError.message); }
    finally { setSaving(false); }
  };

  return <main className="container py-5" style={{ maxWidth: 760 }}>
    <h1>Crear cuenta</h1>
    <p>Registra tus datos y el punto exacto donde entregaremos tu pedido.</p>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit} className="row g-3">
      <div className="col-md-6"><label className="form-label">Nombres</label><input required name="firstName" className="form-control" value={form.firstName} onChange={change} /></div>
      <div className="col-md-6"><label className="form-label">Apellidos</label><input required name="lastName" className="form-control" value={form.lastName} onChange={change} /></div>
      <div className="col-md-6"><label className="form-label">Correo</label><input required type="email" name="email" className="form-control" value={form.email} onChange={change} /></div>
      <div className="col-md-6"><label className="form-label">Teléfono</label><input required name="phone" className="form-control" value={form.phone} onChange={change} /></div>
      <div className="col-12"><label className="form-label">Contraseña (mínimo 10 caracteres)</label><input required minLength="10" type="password" name="password" className="form-control" value={form.password} onChange={change} /></div>
      <div className="col-12"><label className="form-label">Dirección</label><input required minLength="5" name="addressLine" placeholder="Calle, número, distrito" className="form-control" value={form.addressLine} onChange={change} /></div>
      <div className="col-12"><label className="form-label">Referencia</label><input name="reference" className="form-control" value={form.reference} onChange={change} /></div>
      <div className="col-12"><AddressMap position={position} onChange={setPosition} /></div>
      <div className="col-12"><button disabled={saving} className="btn btn-primary">{saving ? "Creando cuenta..." : "Crear cuenta"}</button> <Link to="/productos" className="btn btn-link">Cancelar</Link></div>
    </form>
  </main>;
}
