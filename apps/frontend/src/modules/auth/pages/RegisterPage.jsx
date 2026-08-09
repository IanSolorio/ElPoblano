import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowRight, FaLocationDot, FaShieldHalved, FaUserPlus } from "react-icons/fa6";
import AddressMap from "../components/AddressMap";
import { useAuth } from "../application/AuthContext";
import "../../../css/Registro.css";

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
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, phone: form.phone, address: { label: "Casa", addressLine: form.addressLine, reference: form.reference, latitude: position[0], longitude: position[1] } });
      navigate("/productos");
    } catch (registrationError) { setError(registrationError.message); }
    finally { setSaving(false); }
  };

  return <main className="registration-page"><section className="registration-card"><header><span><FaUserPlus /> Nueva cuenta</span><h1>Empieza tu próximo pedido</h1><p>Registra tus datos y marca el punto exacto donde entregaremos tu compra.</p></header>{error && <div className="registration-error" role="alert">{error}</div>}<form onSubmit={submit} className="registration-form"><div className="registration-form__grid">
    <label>Nombres<input required name="firstName" value={form.firstName} onChange={change} autoComplete="given-name" /></label>
    <label>Apellidos<input required name="lastName" value={form.lastName} onChange={change} autoComplete="family-name" /></label>
    <label>Correo electrónico<input required type="email" name="email" value={form.email} onChange={change} autoComplete="email" /></label>
    <label>Teléfono<input required name="phone" value={form.phone} onChange={change} autoComplete="tel" /></label>
    <label className="registration-field--full">Contraseña <small>Mínimo 10 caracteres</small><input required minLength="10" type="password" name="password" value={form.password} onChange={change} autoComplete="new-password" /></label>
  </div><div className="registration-section-title"><FaLocationDot /><div><strong>Dirección de entrega</strong><small>Esta información se utilizará para ubicar tu pedido.</small></div></div><div className="registration-form__grid"><label className="registration-field--full">Dirección<input required minLength="5" name="addressLine" placeholder="Calle, número y distrito" value={form.addressLine} onChange={change} autoComplete="street-address" /></label><label className="registration-field--full">Referencia<input name="reference" placeholder="Ej. Frente al parque" value={form.reference} onChange={change} /></label><div className="registration-field--full registration-map"><AddressMap position={position} onChange={setPosition} /></div></div>
    <footer className="registration-actions"><p><FaShieldHalved /> Tus datos se utilizan únicamente para gestionar tu cuenta y entrega.</p><div><Link to="/productos">Cancelar</Link><button disabled={saving}>{saving ? "Creando cuenta..." : "Crear cuenta"}<FaArrowRight /></button></div></footer>
  </form></section></main>;
}
