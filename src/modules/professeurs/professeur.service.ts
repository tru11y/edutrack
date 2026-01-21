import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import type { Professeur } from "./professeur.types";

const profsRef = collection(db, "professeurs");
const usersRef = collection(db, "users");

/* ======================
   CREATE PROF + ACCOUNT
====================== */

export async function createProfesseurWithAccount(
  profData: Omit<Professeur, "id" | "createdAt" | "updatedAt">,
  email: string,
  password: string
) {
  // 1. Auth account
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // 2. Prof Firestore
  const profRef = await addDoc(profsRef, {
    ...profData,
    statut: "actif",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const professeurId = profRef.id;

  // 3. User Firestore
  await setDoc(doc(usersRef, uid), {
    uid,
    email,
    role: "prof",
    isActive: true,
    professeurId,
    createdAt: serverTimestamp(),
  });

  return professeurId;
}

/* ======================
   READ
====================== */

export async function getAllProfesseurs(): Promise<Professeur[]> {
  const snap = await getDocs(profsRef);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Professeur),
  }));
}

export async function getProfesseurById(id: string): Promise<Professeur | null> {
  const ref = doc(db, "professeurs", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Professeur) };
}

/* ======================
   UPDATE
====================== */

export async function updateProfesseur(id: string, data: Partial<Professeur>) {
  const ref = doc(db, "professeurs", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* ======================
   SOFT DELETE
====================== */

export async function desactiverProfesseur(id: string) {
  const ref = doc(db, "professeurs", id);
  await updateDoc(ref, {
    statut: "inactif",
    updatedAt: serverTimestamp(),
  });
}
