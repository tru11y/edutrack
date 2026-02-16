import { useAuth } from "../context/AuthContext";
import { DEFAULT_PERMISSIONS_BY_ROLE, type Permission } from "../constants/permissions";

export function usePermissions() {
  const { user } = useAuth();

  const permissions: Permission[] =
    (user as { permissions?: Permission[] })?.permissions ||
    DEFAULT_PERMISSIONS_BY_ROLE[user?.role || ""] ||
    [];

  const hasPermission = (perm: Permission): boolean => {
    // Admin always has all permissions
    if (user?.role === "admin") return true;
    return permissions.includes(perm);
  };

  return { permissions, hasPermission };
}
