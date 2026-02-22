import * as admin from "firebase-admin";
import { db } from "../firebase";

// Collections that hold school-scoped data
const SCHOOL_COLLECTIONS = [
  "eleves", "professeurs", "classes", "cours", "paiements",
  "discipline", "discipline_logs", "cahier", "depenses", "salaires",
  "matieres", "emploi_du_temps", "evaluations", "notes", "bulletins",
  "messages", "alerts", "notifications", "notification_config",
  "admissions", "transport_routes", "livres", "emprunts",
  "devoirs", "submissions", "leave_requests",
];

/**
 * Stamp schoolId on all documents in all school-scoped collections
 * that don't already have one. Returns the number of migrated documents.
 */
export async function migrateDataToSchool(schoolId: string): Promise<number> {
  let totalMigrated = 0;

  for (const collName of SCHOOL_COLLECTIONS) {
    try {
      const snap = await db.collection(collName).get();
      const toMigrate = snap.docs.filter((d) => !d.data().schoolId);
      if (toMigrate.length === 0) continue;

      // Firestore batch limit = 500 writes
      const CHUNK = 400;
      for (let i = 0; i < toMigrate.length; i += CHUNK) {
        const batch = db.batch();
        toMigrate.slice(i, i + CHUNK).forEach((d) =>
          batch.update(d.ref, { schoolId })
        );
        await batch.commit();
      }
      totalMigrated += toMigrate.length;
    } catch {
      // Skip collections that don't exist or have access issues
    }
  }

  // Also migrate users that don't have schoolId yet
  try {
    const usersSnap = await db.collection("users").get();
    const usersToMigrate = usersSnap.docs.filter((d) => !d.data().schoolId);
    const CHUNK = 400;
    for (let i = 0; i < usersToMigrate.length; i += CHUNK) {
      const batch = db.batch();
      usersToMigrate.slice(i, i + CHUNK).forEach((d) =>
        batch.update(d.ref, { schoolId })
      );
      await batch.commit();
    }
    totalMigrated += usersToMigrate.length;
  } catch {
    // Ignore
  }

  return totalMigrated;
}

/**
 * Get the schoolId for a user from their Firestore profile.
 * Auto-migrates legacy users (no schoolId) by assigning them to the first
 * school found, or creating one from the legacy config/school document.
 * When a new school is created, also migrates all existing data.
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
  let isNewSchool = false;

  if (!schoolsSnap.empty) {
    targetSchoolId = schoolsSnap.docs[0].id;
  } else {
    // No schools exist yet: create one from the legacy config
    const configSnap = await db.collection("config").doc("school").get();
    const cfg = configSnap.exists ? (configSnap.data() || {}) : {};
    const newSchoolRef = await db.collection("schools").add({
      schoolName: cfg.schoolName || "EduTrack School",
      email: cfg.email || cfg.emailEcole || "",
      phone: cfg.phone || cfg.telephone || "",
      address: cfg.address || cfg.adresse || "",
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
    isNewSchool = true;
  }

  // Patch the calling user so subsequent calls are instant
  await db.collection("users").doc(uid).update({ schoolId: targetSchoolId });

  // If we just created the school, migrate ALL existing data now
  if (isNewSchool) {
    await migrateDataToSchool(targetSchoolId);
  }

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
