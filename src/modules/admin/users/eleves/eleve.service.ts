import { collection, addDoc, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../../services/firebase";
import type { Eleve } from "./eleve.types";

const COLLECTION = "eleves";

export const createEleve = async (data: Eleve) => {
  await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date(),
  });
};

export const getAllEleves = async (): Promise<Eleve[]> => {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Eleve));
};

export const getEleveById = async (id: string): Promise<Eleve> => {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return { id: snap.id, ...snap.data() } as Eleve;
};

export const updateEleve = async (id: string, data: Partial<Eleve>) => {
  await updateDoc(doc(db, COLLECTION, id), data);
};
