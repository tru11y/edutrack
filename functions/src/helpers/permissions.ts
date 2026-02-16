import { db } from "../firebase";

const ALL_PERMISSIONS = [
  "MANAGE_USERS", "MANAGE_PAYMENTS", "VIEW_ANALYTICS",
  "MANAGE_DISCIPLINE", "MANAGE_NOTES", "MANAGE_PRESENCES",
  "MANAGE_EMPLOI", "MANAGE_CAHIER", "MANAGE_CLASSES",
  "MANAGE_COMPTA", "VIEW_AUDIT_LOGS", "MANAGE_NOTIFICATIONS", "EXPORT_DATA",
];

const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, string[]> = {
  admin: ALL_PERMISSIONS,
  gestionnaire: ALL_PERMISSIONS.filter((p) => p !== "MANAGE_USERS"),
  prof: ["MANAGE_NOTES", "MANAGE_PRESENCES", "MANAGE_CAHIER"],
  eleve: [],
  parent: [],
};

export async function getUserPermissions(uid: string): Promise<string[]> {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return [];

  const data = snap.data()!;
  // If user has explicit permissions, use those
  if (data.permissions && Array.isArray(data.permissions)) {
    return data.permissions;
  }
  // Otherwise fall back to role defaults
  return DEFAULT_PERMISSIONS_BY_ROLE[data.role] || [];
}

export async function verifyPermission(uid: string, permission: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return false;

  const data = snap.data()!;
  // Admin always has all permissions
  if (data.role === "admin") return true;

  const perms = data.permissions && Array.isArray(data.permissions)
    ? data.permissions
    : DEFAULT_PERMISSIONS_BY_ROLE[data.role] || [];

  return perms.includes(permission);
}

export async function verifyHasPermission(uid: string, permission: string): Promise<boolean> {
  return verifyPermission(uid, permission);
}
