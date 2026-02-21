import { db } from "../firebase";

/**
 * Get the schoolId for a user from their Firestore profile.
 * This is the single source of truth for tenant association.
 */
export async function getSchoolId(uid: string): Promise<string> {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) {
    throw new Error("User profile not found.");
  }
  const schoolId = snap.data()?.schoolId;
  if (!schoolId) {
    throw new Error("User is not associated with any school.");
  }
  return schoolId;
}

/**
 * Verify that a user belongs to a specific school.
 */
export async function requireSchoolAccess(uid: string, targetSchoolId: string): Promise<void> {
  const userSchoolId = await getSchoolId(uid);
  if (userSchoolId !== targetSchoolId) {
    throw new Error("Access denied: user does not belong to this school.");
  }
}

/**
 * Check if a user is a super admin (platform-level).
 */
export async function isSuperAdmin(uid: string): Promise<boolean> {
  const snap = await db.collection("superadmins").doc(uid).get();
  return snap.exists;
}

/**
 * Get schoolId, but also allow super admins to target any school.
 * If the user is a super admin and provides a targetSchoolId, use that.
 * Otherwise fall back to the user's own schoolId.
 */
export async function getSchoolIdOrSuper(uid: string, targetSchoolId?: string): Promise<string> {
  if (targetSchoolId) {
    const superAdmin = await isSuperAdmin(uid);
    if (superAdmin) return targetSchoolId;
  }
  return getSchoolId(uid);
}
