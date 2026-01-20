import { collection, addDoc, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Eleve } from "./eleve.types";

const COLLECTION = "eleves";

export const createEleve = async (data: Eleve) => {
  await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date(),
  });
};

export const getAllEleves = async () => {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getEleveById = async (id: string) => {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return { id: snap.id, ...snap.data() };
};

export const updateEleve = async (id: string, data: Partial<Eleve>) => {
  await updateDoc(doc(db, COLLECTION, id), data);
};
