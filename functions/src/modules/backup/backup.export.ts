import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

const BACKUP_COLLECTIONS = [
  "eleves", "paiements", "presences", "cours",
  "notes", "evaluations", "matieres", "salaires",
  "depenses", "cahier", "emploi_du_temps", "classes",
];

// Recursively convert Firestore Timestamps to ISO strings for JSON serialisation
function sanitise(v: unknown): unknown {
  if (v == null) return v;
  if (typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(sanitise);
  if ("toDate" in (v as object) && typeof (v as Record<string, unknown>).toDate === "function") {
    return (v as admin.firestore.Timestamp).toDate().toISOString();
  }
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, sanitise(val)])
  );
}

async function postWebhook(webhookUrl: string, payload: object): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const https = require("https") as typeof import("https");
  const body = JSON.stringify(payload);
  await new Promise<void>((resolve, reject) => {
    const u = new URL(webhookUrl);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        port: u.port || 443,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res: import("http").IncomingMessage) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`HTTP ${res.statusCode}`));
      }
    );
    req.on("error", reject);
    req.setTimeout(30_000, () => reject(new Error("Webhook timeout")));
    req.write(body);
    req.end();
  });
}

async function runBackup(
  schoolId: string,
  triggeredBy: string,
  webhookUrl: string | undefined
) {
  const collectionCounts: Record<string, number> = {};
  const allData: Record<string, unknown[]> = {};
  let totalDocs = 0;

  for (const coll of BACKUP_COLLECTIONS) {
    const snap = await db.collection(coll).where("schoolId", "==", schoolId).get();
    allData[coll] = snap.docs.map((d) => sanitise({ id: d.id, ...d.data() })) as unknown[];
    collectionCounts[coll] = snap.size;
    totalDocs += snap.size;
  }

  const backupRef = await db.collection("backups").add({
    schoolId,
    triggeredBy,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    totalDocs,
    collectionCounts,
    status: "completed",
    webhookSent: false,
  });

  if (webhookUrl) {
    try {
      await postWebhook(webhookUrl, {
        backupId: backupRef.id,
        schoolId,
        exportedAt: new Date().toISOString(),
        totalDocs,
        data: allData,
      });
      await backupRef.update({ webhookSent: true });
    } catch (e) {
      await backupRef.update({ webhookSent: false, webhookError: String(e) });
      functions.logger.warn(`Webhook failed for school ${schoolId}:`, e);
    }
  }

  return {
    backupId: backupRef.id,
    totalDocs,
    collectionCounts,
    exportedAt: new Date().toISOString(),
    webhookSent: !!webhookUrl,
  };
}

// ── Callable: declenchement manuel ───────────────────────────────────────────
export const exportSchoolBackup = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .https.onCall(async (_data, context) => {
    requireAuth(context.auth?.uid);
    const ok = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(ok, "Acces refuse.");
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const schoolSnap = await db.collection("schools").doc(schoolId).get();
      const webhookUrl = schoolSnap.data()?.backupWebhookUrl as string | undefined;
      const result = await runBackup(schoolId, context.auth!.uid, webhookUrl);
      return { success: true, ...result };
    } catch (error) {
      handleError(error, "Erreur lors de la sauvegarde.");
    }
  });

// ── Scheduled: chaque lundi 06h00 WAT (Africa/Abidjan) ───────────────────────
export const weeklyBackup = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .pubsub.schedule("every monday 06:00")
  .timeZone("Africa/Abidjan")
  .onRun(async () => {
    const schoolsSnap = await db.collection("schools").get();
    for (const schoolDoc of schoolsSnap.docs) {
      const webhookUrl = schoolDoc.data().backupWebhookUrl as string | undefined;
      try {
        await runBackup(schoolDoc.id, "system_weekly", webhookUrl);
        functions.logger.info(`Weekly backup OK: ${schoolDoc.id}`);
      } catch (e) {
        functions.logger.error(`Weekly backup FAILED: ${schoolDoc.id}`, e);
      }
    }
  });
