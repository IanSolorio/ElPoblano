import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/application/AuthContext";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default function ProtectedAdminRoute({ children, allowedRoles = ADMIN_ROLES }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-5 text-center">Validando acceso...</div>;
  return user && allowedRoles.includes(user.role) ? children : <Navigate to="/" replace />;
}
