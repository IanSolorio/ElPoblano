import { useEffect, useState } from "react";
import { FaPlus, FaShieldHalved, FaUser } from "react-icons/fa6";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../../auth/application/AuthContext";
import { createAdminUser, listAdminUsers, setUserStatus } from "../infrastructure/adminApi";

const emptyForm = { email: "", password: "", firstName: "", lastName: "" };
const roleLabel = (role) => {
  if (role === "CUSTOMER") return "Cliente";
  if (role === "SUPER_ADMIN") return "Admin. principal";
  return "Administrador";
};

export default function UsersAdminPage() {
  const { user } = useAuth();
  const [result, setResult] = useState({ data: [] });
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const load = async () => { try { setResult(await listAdminUsers()); } catch (loadError) { setError(loadError.message); } };
  useEffect(() => { load(); }, []);
  const submit = async (event) => { event.preventDefault(); setError(""); try { await createAdminUser(form); setForm(emptyForm); await load(); } catch (submitError) { setError(submitError.message); } };
  const toggle = async (account) => { try { await setUserStatus(account.id, !account.active); await load(); } catch (toggleError) { setError(toggleError.message); } };

  return (
    <AdminLayout eyebrow="Seguridad" title="Usuarios y accesos" description="Consulta clientes y controla las cuentas autorizadas.">
      {error && <div className="admin-alert">{error}</div>}
      {user?.role === "SUPER_ADMIN" && <form className="admin-form-card admin-form-card--horizontal" onSubmit={submit}>
        <div className="admin-form-card__section-title"><span>Crear administrador</span><p>Otorga acceso al panel a un nuevo integrante.</p></div>
        <div className="admin-form-grid admin-form-grid--four">
          <label className="admin-field">Nombres<input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required /></label>
          <label className="admin-field">Apellidos<input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required /></label>
          <label className="admin-field">Correo<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
          <label className="admin-field">Contraseña<input type="password" minLength="10" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
        </div>
        <div className="admin-create-user-actions">
          <button type="submit" className="admin-primary-action"><FaPlus /> Crear cuenta</button>
        </div>
      </form>}

      <section className="admin-panel-card">
        <div className="admin-panel-card__toolbar"><div><h2>Cuentas registradas</h2><p>Administra estados y permisos operativos.</p></div><span className="admin-panel-icon"><FaShieldHalved /></span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{result.data.map((account) => <tr key={account.id}><td><div className="admin-user-cell"><span><FaUser /></span><strong>{account.firstName} {account.lastName}</strong></div></td><td>{account.email}</td><td><span className="admin-category-pill">{roleLabel(account.role)}</span></td><td><span className={account.active ? "admin-status" : "admin-status admin-status--off"}><i /> {account.active ? "Activo" : "Inactivo"}</span></td><td><button type="button" className="admin-outline-action" onClick={() => toggle(account)}>{account.active ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table></div>
      </section>
    </AdminLayout>
  );
}
