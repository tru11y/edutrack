import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../services/firebase";
import { calculerPaiement } from "./paiement.logic";
import type { Paiement, MethodePaiement } from "./paiement.types";

const paiementsRef = collection(db, "paiements");

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
  // 🔒 Anti-doublon (élève + mois)
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
   ENREGISTRER UN VERSEMENT
========================= */


export const enregistrerVersement = async (
  paiement: Paiement,
  montant: number,
  methode: MethodePaiement
) => {
  const nouveauPaye = paiement.montantPaye + montant;

  const { statut, montantRestant } = calculerPaiement(
    paiement.montantTotal,
    nouveauPaye
  );

  const ref = doc(db, "paiements", paiement.id!);

  await updateDoc(ref, {
    montantPaye: nouveauPaye,
    montantRestant,
    statut,
    versements: [
      ...(paiement.versements || []),
      {
        montant,
        methode,
        date: new Date(),
      },
    ],
  });

  // 🔓 DÉBAN AUTO SI SOLDÉ
  if (statut === "paye") {
    await unbanEleve(paiement.eleveId);
  }
};

// paiement.service.ts
import { updateEleve } from "../eleves/eleve.service";

export async function unbanEleve(eleveId: string) {
  await updateEleve(eleveId, {
    isBanned: false,
    banReason: null,
    banDate: null,
  });
}
