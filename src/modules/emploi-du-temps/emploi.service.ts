import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Creneau } from "./emploi.types";

const COLLECTION = "emploi_du_temps";

export const createCreneau = async (data: Creneau) => {
  await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date(),
  });
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
