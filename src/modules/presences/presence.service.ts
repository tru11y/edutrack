import {
  collection,
  query,
  where,
  getDocs,
  collectionGroup,
  doc,
  setDoc,
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

/* WRITE - subcollection based */

export async function savePresencesForCours(payload: PresenceCoursPayload): Promise<void> {
  const { coursId, presences, classe, date } = payload;

  for (const item of presences) {
    const appelsRef = collection(db, "presences", coursId, "appels");
    const appelDoc = doc(appelsRef, item.eleveId);
    await setDoc(appelDoc, {
      eleveId: item.eleveId,
      statut: item.statut,
      minutesRetard: item.minutesRetard ?? 0,
      classe,
      date,
      coursId,
      marqueePar: "manual",
    });
  }
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

/* ADMIN - top-level for backward compat */

export async function getAllPresences(): Promise<PresenceDocument[]> {
  const snap = await getDocs(presencesRef);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as PresenceCoursPayload),
  }));
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
