import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { DisciplineRecord } from "./discipline.types";

const disciplineRef = collection(db, "discipline");

export async function logDisciplineIncident(
  data: Omit<DisciplineRecord, "id" | "createdAt">
) {
  await addDoc(disciplineRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getDisciplineByEleve(eleveId: string) {
  const q = query(disciplineRef, where("eleveId", "==", eleveId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as DisciplineRecord),
  }));
}

export async function getAllDiscipline() {
  const snap = await getDocs(disciplineRef);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as DisciplineRecord),
  }));
}
