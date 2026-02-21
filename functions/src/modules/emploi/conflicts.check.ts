import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { requireAuth, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

interface Conflict {
  type: "prof" | "classe";
  jour: string;
  heureDebut: string;
  heureFin: string;
  details: string;
  creneauIds: string[];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1), e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2), e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

export const checkScheduleConflicts = functions
  .region("europe-west1")
  .https.onCall(async (_data: unknown, context) => {
    requireAuth(context.auth?.uid);

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const snap = await db.collection("emploi_du_temps").where("schoolId", "==", schoolId).get();
      const creneaux = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const conflicts: Conflict[] = [];

      for (let i = 0; i < creneaux.length; i++) {
        for (let j = i + 1; j < creneaux.length; j++) {
          const a = creneaux[i] as Record<string, string>;
          const b = creneaux[j] as Record<string, string>;

          if (a.jour !== b.jour) continue;
          if (!hasOverlap(a.heureDebut, a.heureFin, b.heureDebut, b.heureFin)) continue;

          // Same prof conflict
          if (a.professeurId && a.professeurId === b.professeurId) {
            conflicts.push({
              type: "prof",
              jour: a.jour,
              heureDebut: a.heureDebut,
              heureFin: a.heureFin,
              details: `Prof ${a.professeurNom || a.professeurId} : ${a.classe} (${a.matiere}) et ${b.classe} (${b.matiere})`,
              creneauIds: [a.id, b.id],
            });
          }

          // Same classe conflict
          if (a.classe === b.classe) {
            conflicts.push({
              type: "classe",
              jour: a.jour,
              heureDebut: a.heureDebut,
              heureFin: a.heureFin,
              details: `Classe ${a.classe} : ${a.matiere} et ${b.matiere}`,
              creneauIds: [a.id, b.id],
            });
          }
        }
      }

      return { success: true, conflicts };
    } catch (error) {
      handleError(error, "Erreur lors de la verification des conflits.");
    }
  });
