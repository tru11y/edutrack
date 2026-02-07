import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../services/firebase";
import { calculerPaiement } from "./paiement.logic";
import type { Paiement } from "./paiement.types";
import { updateEleveSystem } from "../eleves/eleve.service";

const paiementsRef = collection(db, "paiements");

/* =========================
   HELPERS
========================= */

export async function unbanEleve(eleveId: string) {
  await updateEleveSystem(eleveId, {
    isBanned: false,
    banReason: null,
    banDate: null,
  });
}

async function unbanEleveIfFullyPaid(
  eleveId: string,
  montantRestant: number
) {
  if (montantRestant <= 0) {
    await unbanEleve(eleveId);
  }
}

/* =========================
   GETTERS
========================= */

export const getAllPaiements = async (): Promise<Paiement[]> => {
  const snap = await getDocs(paiementsRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Paiement[];
};

export const getPaiementsByEleve = async (
  eleveId: string
): Promise<Paiement[]> => {
  const q = query(paiementsRef, where("eleveId", "==", eleveId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Paiement[];
};

/* =========================
   CREATE PAIEMENT (ANTI-DOUBLON)
========================= */

export const createPaiementMensuel = async (
  data: Omit<
    Paiement,
    "id" | "statut" | "montantRestant" | "createdAt" | "versements"
  >
) => {
  const q = query(
    paiementsRef,
    where("eleveId", "==", data.eleveId),
    where("mois", "==", data.mois)
  );

  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error("Paiement déjà existant pour ce mois");
  }

  const { statut, montantRestant } = calculerPaiement(
    data.montantTotal,
    data.montantPaye
  );

  await addDoc(paiementsRef, {
    ...data,
    statut,
    montantRestant,
    versements: [],
    createdAt: serverTimestamp(),
  });
};

/* =========================
   DELETE PAIEMENT
========================= */

export const deletePaiement = async (paiementId: string): Promise<void> => {
  const ref = doc(db, "paiements", paiementId);
  await deleteDoc(ref);
};

/* =========================
   GET BY ID
========================= */

export const getPaiementById = async (id: string): Promise<Paiement | null> => {
  const ref = doc(db, "paiements", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  } as Paiement;
};

/* =========================
   UPDATE PAIEMENT
========================= */

export const updatePaiement = async (
  id: string,
  data: Partial<Paiement>
): Promise<void> => {
  const ref = doc(db, "paiements", id);
  await updateDoc(ref, data);
};

/* =========================
   MOVE TO TRASH
========================= */

export const movePaiementToTrash = async (id: string): Promise<void> => {
  const ref = doc(db, "paiements", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Paiement introuvable");

  const data = snap.data() as Paiement;

  // Save to trash collection
  await addDoc(collection(db, "corbeille"), {
    type: "paiements",
    originalId: id,
    data: data,
    deletedAt: serverTimestamp(),
  });

  // Delete from paiements
  await deleteDoc(ref);
};
