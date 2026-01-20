import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Eleve } from "./eleve.types";
import { validateEleve } from "./eleve.validators";

const elevesRef = collection(db, "eleves");

/* ======================
   HELPERS (UX SAFE)
====================== */

function normalizeEleve(data: Partial<Eleve>): Eleve {
  return {
    nom: data.nom ?? "",
    prenom: data.prenom ?? "",
    sexe: (data.sexe === "M" || data.sexe === "F" ? data.sexe : "M") as "M" | "F",
    classe: data.classe ?? "",
    statut: data.statut ?? "actif",

    // 🔒 JAMAIS undefined
    parents: Array.isArray(data.parents) ? data.parents : [],
    contactUrgence: data.contactUrgence ?? undefined,

    ecoleOrigine: data.ecoleOrigine ?? "",
    adresse: data.adresse ?? undefined,

    createdAt: data.createdAt ?? (serverTimestamp() as any),
    updatedAt: serverTimestamp() as any,
  };
}

/* ======================
   READ
====================== */

export async function getAllEleves(): Promise<Eleve[]> {
  const snap = await getDocs(elevesRef);

  return snap.docs.map((d) =>
    normalizeEleve({
      id: d.id,
      ...(d.data() as Eleve),
    })
  );
}

export async function getEleveById(id: string): Promise<Eleve | null> {
  const ref = doc(db, "eleves", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return normalizeEleve({
    id: snap.id,
    ...(snap.data() as Eleve),
  });
}

/* ======================
   CREATE
====================== */

export async function createEleve(data: Partial<Eleve>): Promise<string> {
  validateEleve(data);

  const payload = normalizeEleve(data);

  const docRef = await addDoc(elevesRef, payload);
  return docRef.id; // 🔥 UX: retour immédiat
}

/* ======================
   UPDATE
====================== */

export async function updateEleve(id: string, data: Partial<Eleve>) {
  validateEleve(data);

  const ref = doc(db, "eleves", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* ======================
   SOFT DELETE
====================== */

export async function desactiverEleve(id: string) {
  const ref = doc(db, "eleves", id);
  await updateDoc(ref, {
    statut: "inactif",
    updatedAt: serverTimestamp(),
  });
}
