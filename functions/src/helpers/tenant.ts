import * as admin from "firebase-admin";
import { db } from "../firebase";

/**
 * Get the schoolId for a user from their Firestore profile.
 * Auto-migrates legacy users (no schoolId) by assigning them to the first
 * school found, or creating one from the legacy config/school document.
 */
export async function getSchoolId(uid: string): Promise<string> {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) {
    throw new Error("User profile not found.");
  }
  const schoolId = snap.data()?.schoolId;
  if (schoolId) return schoolId;

  // --- Auto-migration for legacy users without schoolId ---
  const schoolsSnap = await db.collection("schools").limit(1).get();
  let targetSchoolId: string;

  if (!schoolsSnap.empty) {
    targetSchoolId = schoolsSnap.docs[0].id;
  } else {
    // No schools exist yet: create one from the legacy config
    const configSnap = await db.collection("config").doc("school").get();
    const cfg = configSnap.exists ? (configSnap.data() || {}) : {};
    const newSchoolRef = await db.collection("schools").add({
      schoolName: cfg.schoolName || "EduTrack School",
      email: cfg.email || "",
      phone: cfg.phone || "",
      address: cfg.address || "",
      plan: "pro",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await db.collection("school_subscriptions").doc(newSchoolRef.id).set({
      plan: "pro",
      maxEleves: 1000,
      status: "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    });
    targetSchoolId = newSchoolRef.id;
  }

  // Patch the user document so subsequent calls are instant
  await db.collection("users").doc(uid).update({ schoolId: targetSchoolId });
  return targetSchoolId;
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
