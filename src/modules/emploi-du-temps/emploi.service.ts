import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Creneau } from "./emploi.types";

const COLLECTION = "emploi_du_temps";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasOverlap(a: Creneau, b: Creneau): boolean {
  if (a.jour !== b.jour) return false;
  const aStart = timeToMinutes(a.heureDebut);
  const aEnd = timeToMinutes(a.heureFin);
  const bStart = timeToMinutes(b.heureDebut);
  const bEnd = timeToMinutes(b.heureFin);
  return aStart < bEnd && bStart < aEnd;
}

export const createCreneau = async (data: Omit<Creneau, "id" | "createdAt">): Promise<void> => {
  // Validation cours du soir : heureDebut >= 17:00
  if (data.type === "soir") {
    const debut = timeToMinutes(data.heureDebut);
    if (debut < 17 * 60) {
      throw new Error("Les cours du soir doivent commencer a partir de 17h00.");
    }
  }

  // Vérification des chevauchements (même prof OU même classe)
  const existing = await getCreneauxByJour(data.jour);
  for (const creneau of existing) {
    if (hasOverlap(data as Creneau, creneau)) {
      if (creneau.professeurId === data.professeurId) {
        throw new Error(`Conflit: ce professeur a deja un cours ${creneau.heureDebut}-${creneau.heureFin} (${creneau.matiere}).`);
      }
      if (creneau.classe === data.classe) {
        throw new Error(`Conflit: la classe ${data.classe} a deja un cours ${creneau.heureDebut}-${creneau.heureFin} (${creneau.matiere}).`);
      }
    }
  }

  await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date(),
  });
};

export const deleteCreneau = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

export const getCreneaux = async (): Promise<Creneau[]> => {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Creneau));
};

export const getCreneauxByJour = async (jour: string): Promise<Creneau[]> => {
  const q = query(
    collection(db, COLLECTION),
    where("jour", "==", jour)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Creneau));
};
