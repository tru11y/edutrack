import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { CahierEntry } from "./cahier.types";

const cahierRef = collection(db, "cahier");

/* ========================= 
   CREATE
========================= */

export async function createCahierEntry(
  data: Omit<
    CahierEntry,
    "id" | "createdAt" | "updatedAt" | "isSigned" | "signedAt"
  >
) {
  await addDoc(cahierRef, {
    ...data,
    isSigned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* ========================= 
   GET
========================= */

export async function getCahierByCours(coursId: string) {
  const q = query(cahierRef, where("coursId", "==", coursId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as CahierEntry),
  }));
}

export async function getCahierByClasse(classe: string) {
  const q = query(cahierRef, where("classe", "==", classe));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as CahierEntry),
  }));
}

export async function getAllCahiers() {
  const snap = await getDocs(cahierRef);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as CahierEntry),
  }));
}

/* ========================= 
   SIGN
========================= */

export async function signCahierEntry(
  entryId: string,
  profId: string
) {
  const ref = doc(db, "cahier", entryId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Entrée introuvable");

  const data = snap.data() as CahierEntry;

  if (data.isSigned) {
    throw new Error("Déjà signé");
  }

  if (data.profId !== profId) {
    throw new Error("Signature non autorisée");
  }

  const token = Math.random().toString(36).slice(2);

  await updateDoc(ref, {
    isSigned: true,
    signedAt: serverTimestamp(),
    signatureToken: token,
    updatedAt: serverTimestamp(),
  });
}

/* ========================= 
   UPDATE
========================= */

export async function updateCahierEntry(
  id: string,
  data: Partial<CahierEntry>
) {
  const ref = doc(db, "cahier", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Entrée introuvable");

  const entry = snap.data() as CahierEntry;

  if (entry.isSigned) {
    throw new Error("Cahier verrouillé");
  }

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
