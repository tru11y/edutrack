/**
 * Migration script: Convert single-tenant EduTrack to multi-tenant.
 *
 * Usage: npx ts-node scripts/migrate-to-multitenant.ts
 *
 * What it does:
 * 1. Creates a default school in schools/
 * 2. Creates a default subscription in school_subscriptions/
 * 3. Adds schoolId to ALL existing documents in all collections
 */

import * as admin from "firebase-admin";

// Initialize with service account
admin.initializeApp();
const db = admin.firestore();

const BATCH_SIZE = 500;

const COLLECTIONS_TO_MIGRATE = [
  "users",
  "eleves",
  "professeurs",
  "cours",
  "presences",
  "paiements",
  "cahier",
  "messages",
  "classes",
  "corbeille",
  "connection_logs",
  "depenses",
  "salaires",
  "audit_logs",
  "matieres",
  "emploi_du_temps",
  "evaluations",
  "notes",
  "notifications",
  "notification_config",
  "bulletins",
  "discipline",
  "discipline_logs",
  "alerts",
  "online_users",
];

async function migrateCollection(collectionName: string, schoolId: string): Promise<number> {
  const snap = await db.collection(collectionName).get();
  if (snap.empty) {
    console.log(`  [SKIP] ${collectionName}: empty`);
    return 0;
  }

  let count = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.schoolId) continue; // Already migrated

    batch.update(doc.ref, { schoolId });
    batchCount++;
    count++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`  [BATCH] ${collectionName}: committed ${count} docs`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`  [DONE] ${collectionName}: migrated ${count}/${snap.size} docs`);
  return count;
}

async function main() {
  console.log("=== EduTrack Multi-Tenant Migration ===\n");

  // 1. Read existing school config
  const configSnap = await db.collection("config").doc("school").get();
  const configData = configSnap.exists ? configSnap.data() : {};

  // 2. Create default school
  const schoolRef = db.collection("schools").doc();
  const schoolId = schoolRef.id;

  await schoolRef.set({
    schoolName: configData?.schoolName || "EduTrack",
    schoolLogo: configData?.schoolLogo || "",
    primaryColor: configData?.primaryColor || "#6366f1",
    anneeScolaire: configData?.anneeScolaire || "2025-2026",
    adresse: configData?.adresse || "",
    telephone: configData?.telephone || "",
    email: configData?.email || "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    plan: "free",
    isActive: true,
  });

  console.log(`Created default school: ${schoolId}`);
  console.log(`  Name: ${configData?.schoolName || "EduTrack"}\n`);

  // 3. Create default subscription
  await db.collection("school_subscriptions").doc(schoolId).set({
    schoolId,
    plan: "free",
    maxEleves: 50,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Created default subscription (free plan)\n");

  // 4. Migrate all collections
  let totalMigrated = 0;
  for (const col of COLLECTIONS_TO_MIGRATE) {
    try {
      const migrated = await migrateCollection(col, schoolId);
      totalMigrated += migrated;
    } catch (error) {
      console.error(`  [ERROR] ${col}:`, error);
    }
  }

  // 5. Migrate presences subcollections
  console.log("\nMigrating presences subcollections...");
  const presencesSnap = await db.collection("presences").get();
  for (const presDoc of presencesSnap.docs) {
    const appelsSnap = await presDoc.ref.collection("appels").get();
    if (appelsSnap.empty) continue;

    let batch = db.batch();
    let batchCount = 0;
    for (const appel of appelsSnap.docs) {
      if (appel.data().schoolId) continue;
      batch.update(appel.ref, { schoolId });
      batchCount++;
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
    if (batchCount > 0) await batch.commit();
  }

  console.log(`\n=== Migration complete ===`);
  console.log(`School ID: ${schoolId}`);
  console.log(`Total documents migrated: ${totalMigrated}`);
  console.log(`\nIMPORTANT: Save this school ID for reference.`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
