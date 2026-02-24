import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";

export type ActivityAction =
  | "create" | "update" | "delete" | "login" | "export" | "import"
  | "payment_add" | "payment_delete" | "presence_mark"
  | "user_activate" | "user_deactivate" | "password_reset";

export type ActivityEntity =
  | "eleve" | "user" | "paiement" | "presence" | "cahier"
  | "depense" | "salaire" | "evaluation" | "classe" | "matiere"
  | "emploi_du_temps" | "discipline" | "school_settings";

export interface ActivityLogEntry {
  schoolId?: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string;
  entityLabel?: string; // human-readable name (e.g. "Jean Dupont")
  details?: string;     // extra context
  timestamp: ReturnType<typeof serverTimestamp>;
}

/**
 * Write an activity log entry to Firestore.
 * Silent — never throws, so it never breaks the calling flow.
 */
export async function logActivity(params: {
  schoolId?: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string;
  entityLabel?: string;
  details?: string;
}): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Get actor metadata from Firestore user doc (cached in sessionStorage to avoid extra reads)
    const cached = sessionStorage.getItem("edutrack_actor_meta");
    let actorName = user.displayName || user.email || user.uid;
    let actorRole = "unknown";
    let actorSchoolId = params.schoolId || "";

    if (cached) {
      try {
        const meta = JSON.parse(cached);
        actorName = meta.name || actorName;
        actorRole = meta.role || actorRole;
        actorSchoolId = meta.schoolId || actorSchoolId;
      } catch {
        // ignore
      }
    }

    const entry: ActivityLogEntry = {
      schoolId: actorSchoolId || undefined,
      actorUid: user.uid,
      actorName,
      actorRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      entityLabel: params.entityLabel,
      details: params.details,
      timestamp: serverTimestamp(),
    };

    // Remove undefined fields
    const clean = Object.fromEntries(
      Object.entries(entry).filter(([, v]) => v !== undefined)
    );

    await addDoc(collection(db, "activity_logs"), clean);
  } catch {
    // Never break the caller
  }
}

/**
 * Cache the current user's actor metadata so logActivity doesn't need to
 * re-read Firestore on every call. Call this once after auth resolves.
 */
export function cacheActorMeta(name: string, role: string, schoolId: string): void {
  try {
    sessionStorage.setItem(
      "edutrack_actor_meta",
      JSON.stringify({ name, role, schoolId })
    );
  } catch {
    // ignore
  }
}
