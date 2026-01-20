import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/User";

export const ProtectedRoute = ({
  children,
  roles,
}: {
  children: JSX.Element;
  roles?: UserRole[];
}) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
