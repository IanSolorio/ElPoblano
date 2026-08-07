import { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { createAdminUser, listAdminUsers, setUserStatus } from "../infrastructure/adminApi";

export default function UsersAdminPage() {
  const [result,setResult]=useState({data:[]}); const [error,setError]=useState(""); const [form,setForm]=useState({email:"",password:"",firstName:"",lastName:""});
  const load=async()=>{try{setResult(await listAdminUsers());}catch(e){setError(e.message);}}; useEffect(()=>{load();},[]);
  const submit=async(e)=>{e.preventDefault();try{await createAdminUser(form);setForm({email:"",password:"",firstName:"",lastName:""});await load();}catch(err){setError(err.message);}};
  return <div className="d-flex"><AdminSidebar/><main className="container p-4"><h1>Usuarios</h1>{error&&<div className="alert alert-danger">{error}</div>}
    <form className="card card-body mb-4" onSubmit={submit}><h5>Crear administrador (solo SUPER_ADMIN)</h5><div className="row g-2"><div className="col"><input className="form-control" placeholder="Nombres" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required/></div><div className="col"><input className="form-control" placeholder="Apellidos" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required/></div><div className="col"><input className="form-control" type="email" placeholder="Correo" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div><div className="col"><input className="form-control" type="password" minLength="10" placeholder="Contraseña" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></div></div><button className="btn btn-primary mt-2">Crear</button></form>
    <table className="table"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{result.data.map(u=><tr key={u.id}><td>{u.firstName} {u.lastName}</td><td>{u.email}</td><td>{u.role}</td><td>{u.active?"Activo":"Inactivo"}</td><td><button className="btn btn-sm btn-outline-secondary" onClick={async()=>{await setUserStatus(u.id,!u.active);await load();}}>{u.active?"Desactivar":"Activar"}</button></td></tr>)}</tbody></table></main></div>;
}
