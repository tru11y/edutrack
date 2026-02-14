import {
  collection,
  query,
  where,
  getDocs,
  collectionGroup,
  doc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { PresenceCoursPayload, PresenceItem } from "./presence.types";
import { estFacturable } from "./facturation.logic";

const presencesRef = collection(db, "presences");

interface PresenceDocument extends PresenceCoursPayload {
  id: string;
}

export interface AppelDocument {
  id: string;
  eleveId: string;
  statut: string;
  minutesRetard?: number;
  coursId: string;
  classe: string;
  date: string;
  marqueePar: string;
}

/* WRITE - batch atomique */

export async function savePresencesForCours(payload: PresenceCoursPayload): Promise<void> {
  const { coursId, presences, classe, date } = payload;

  if (!coursId || !classe || !date || presences.length === 0) {
    throw new Error("Donnees de presence invalides: coursId, classe, date et presences sont requis.");
  }

  const batch = writeBatch(db);

  // Document parent avec le resume
  const parentRef = doc(db, "presences", coursId);
  batch.set(parentRef, {
    coursId,
    classe,
    date,
    presences: presences.map((item) => ({
      eleveId: item.eleveId,
      statut: item.statut,
      minutesRetard: item.minutesRetard ?? 0,
      facturable: item.facturable ?? item.statut !== "absent",
      statutMetier: item.statutMetier ?? "autorise",
      message: item.message ?? "",
    })),
    updatedAt: new Date(),
  }, { merge: true });

  // Ecrire chaque appel dans la subcollection
  for (const item of presences) {
    if (!item.eleveId) continue;
    const appelRef = doc(db, "presences", coursId, "appels", item.eleveId);
    batch.set(appelRef, {
      eleveId: item.eleveId,
      statut: item.statut,
      minutesRetard: item.minutesRetard ?? 0,
      classe,
      date,
      coursId,
      marqueePar: "manual",
    });
  }

  await batch.commit();
}

/* READ - subcollection based (Pattern B) */

export async function getPresencesByCours(coursId: string): Promise<PresenceDocument[]> {
  const appelsRef = collection(db, "presences", coursId, "appels");
  const snap = await getDocs(appelsRef);

  if (snap.empty) return [];

  const presenceItems: PresenceItem[] = snap.docs.map((d) => {
    const data = d.data();
    const statut = data.statut || "present";
    const minutesRetard = data.minutesRetard ?? 0;
    return {
      eleveId: data.eleveId,
      statut,
      minutesRetard: minutesRetard || undefined,
      facturable: estFacturable(statut, minutesRetard),
      statutMetier: "autorise" as const,
      message: "",
    };
  });

  const firstDoc = snap.docs[0].data();

  return [{
    id: coursId,
    coursId,
    classe: firstDoc.classe || "",
    date: firstDoc.date || "",
    presences: presenceItems,
  }];
}

/* ADMIN - top-level documents + fallback subcollection read */

export async function getAllPresences(): Promise<PresenceDocument[]> {
  const snap = await getDocs(presencesRef);
  const results: PresenceDocument[] = [];

  for (const d of snap.docs) {
    try {
      const data = d.data();

      // Si le doc parent a deja le tableau presences (nouveau format)
      if (data.presences && Array.isArray(data.presences) && data.presences.length > 0) {
        results.push({
          id: d.id,
          coursId: data.coursId || d.id,
          classe: data.classe || "",
          date: data.date || "",
          presences: data.presences,
        });
      } else if (data.classe && data.date) {
        // Ancien format: lire la subcollection appels
        const appelsSnap = await getDocs(collection(db, "presences", d.id, "appels"));
        if (!appelsSnap.empty) {
          const presenceItems: PresenceItem[] = appelsSnap.docs.map((a) => {
            const ad = a.data();
            const statut = ad.statut || "present";
            const minutesRetard = ad.minutesRetard ?? 0;
            return {
              eleveId: ad.eleveId,
              statut,
              minutesRetard: minutesRetard || undefined,
              facturable: estFacturable(statut, minutesRetard),
              statutMetier: "autorise" as const,
              message: "",
            };
          });
          results.push({
            id: d.id,
            coursId: data.coursId || d.id,
            classe: data.classe,
            date: data.date,
            presences: presenceItems,
          });
        }
      }
    } catch (err) {
      console.error(`Erreur lecture presence doc ${d.id}:`, err);
    }
  }

  return results;
}

/* ELEVE - collectionGroup query on "appels" subcollection */

export async function getPresenceHistoryForEleve(eleveId: string): Promise<AppelDocument[]> {
  const appelsGroup = collectionGroup(db, "appels");
  const q = query(appelsGroup, where("eleveId", "==", eleveId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<AppelDocument, "id">),
  }));
}
