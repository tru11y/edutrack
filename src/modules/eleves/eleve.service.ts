import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../services/firebase";
import type { Eleve } from "./eleve.types";
import { validateEleve } from "./eleve.validators";

/* ======================
   COLLECTION
====================== */

const elevesRef = collection(db, "eleves");

/* ======================
   HELPERS
====================== */

function normalizeEleve(data: Partial<Eleve>): Eleve {
  const normalized: Eleve = {
    id: data.id,
    nom: data.nom ?? "",
    prenom: data.prenom ?? "",
    sexe: (data.sexe === "M" || data.sexe === "F" ? data.sexe : "M") as "M" | "F",
    classe: data.classe ?? "",
    statut: data.statut ?? "actif",
    parents: Array.isArray(data.parents) ? data.parents : [],
    ecoleOrigine: data.ecoleOrigine ?? "",
    isBanned: false,
    createdAt: data.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (data.contactUrgence !== undefined) {
    normalized.contactUrgence = data.contactUrgence;
  }

  if (data.adresse !== undefined) {
    normalized.adresse = data.adresse;
  }

  return normalized;
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

export async function getElevesBannis(): Promise<Eleve[]> {
  const q = query(elevesRef, where("isBanned", "==", true));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Eleve, "id">),
  }));
}

/* ======================
   CREATE SIMPLE
====================== */

export async function createEleve(data: Partial<Eleve>): Promise<string> {
  validateEleve(data);

  const payload = normalizeEleve(data);

  const docRef = await addDoc(elevesRef, payload);
  return docRef.id;
}

/* ======================
   CREATE AVEC COMPTE FIREBASE
====================== */

export async function createEleveWithAccount(data: {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  classe: string;
  sexe: "M" | "F";
  parents?: import("./eleve.types").ParentContact[];
}) {
  // 1️⃣ Création Auth
  await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );

  // 2️⃣ Création Firestore

  const elevePayload: Eleve = {
    nom: data.nom,
    prenom: data.prenom,
    sexe: data.sexe,
    classe: data.classe,
    statut: "actif",
    parents: Array.isArray(data.parents) ? data.parents : [],
    ecoleOrigine: "",
    isBanned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(elevesRef, elevePayload);

  return ref.id;
}

/* ======================
   UPDATE STANDARD (UI)
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
   UPDATE SYSTEM (PAIEMENT / BAN / AUTO)
====================== */

export async function updateEleveSystem(id: string, data: Partial<Eleve>) {
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

/* ======================
   MOVE TO TRASH
====================== */

export async function moveEleveToTrash(id: string): Promise<void> {
  const ref = doc(db, "eleves", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Eleve introuvable");

  const data = snap.data() as Eleve;

  // Save to trash collection
  await addDoc(collection(db, "corbeille"), {
    type: "eleves",
    originalId: id,
    data: data,
    deletedAt: serverTimestamp(),
  });

  // Delete from eleves
  await deleteDoc(ref);
}
