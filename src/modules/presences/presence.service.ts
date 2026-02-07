import {
  collection,
  query,
  where,
  getDocs,
  collectionGroup,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { PresenceCoursPayload, PresenceItem } from "./presence.types";

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

/* READ - subcollection based (Pattern B) */

export async function getPresencesByCours(coursId: string): Promise<PresenceDocument[]> {
  const appelsRef = collection(db, "presences", coursId, "appels");
  const snap = await getDocs(appelsRef);

  if (snap.empty) return [];

  const presenceItems: PresenceItem[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      eleveId: data.eleveId,
      statut: data.statut || "present",
      minutesRetard: data.minutesRetard ?? undefined,
      facturable: true,
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
