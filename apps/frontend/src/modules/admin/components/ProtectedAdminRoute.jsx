import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../../auth/infrastructure/authApi";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default function ProtectedAdminRoute({ children, allowedRoles = ADMIN_ROLES }) {
  const [state, setState] = useState({ loading: true, allowed: false });
  useEffect(() => {
    getCurrentUser()
      .then((user) => setState({ loading: false, allowed: allowedRoles.includes(user.role) }))
      .catch(() => setState({ loading: false, allowed: false }));
  }, [allowedRoles]);
  if (state.loading) return <div className="p-5 text-center">Validando acceso...</div>;
  return state.allowed ? children : <Navigate to="/" replace />;
}
