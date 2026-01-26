import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/User";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Chargement…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🔒 BLOCAGE ÉLÈVE BANNI
  if (user.role === "eleve" && user.isBanned) {
    return <Navigate to="/compte-suspendu" replace />;
  }

  // 🔐 RÔLES - Admin peut accéder à toutes les vues
  if (roles && !roles.includes(user.role) && user.role !== "admin") {
    return <Navigate to={`/${user.role}`} replace />;
  }

  // 🔐 INACTIF
  if (user.isActive === false) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
