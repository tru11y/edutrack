import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/User";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: UserRole[];
}) {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  if (!user.isActive) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
