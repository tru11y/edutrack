import { collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { updateEleveSystem } from "../eleves/eleve.service";
import { notifyAdmin } from "../notifications/alert.service";
import type { Paiement } from "./paiement.types";
import type { Eleve } from "../eleves/eleve.types";

interface EleveWithId extends Eleve {
  id: string;
}

interface PaiementData extends Omit<Paiement, "id"> {
  id: string;
}

/**
 * Calcule le nombre de mois impayés consécutifs pour un élève
 */
function countMoisImpayes(
  eleveId: string,
  paiements: PaiementData[],
  moisActuel: string
): number {
  const elevePaiements = paiements
    .filter((p) => p.eleveId === eleveId)
    .sort((a, b) => b.mois.localeCompare(a.mois));

  let moisImpayes = 0;
  const [annee, mois] = moisActuel.split("-").map(Number);

  // Vérifier les 12 derniers mois maximum
  for (let i = 0; i < 12; i++) {
    const checkMois = mois - i;
    const checkAnnee = checkMois <= 0 ? annee - 1 : annee;
    const checkMoisNorm = checkMois <= 0 ? checkMois + 12 : checkMois;
    const moisKey = `${checkAnnee}-${String(checkMoisNorm).padStart(2, "0")}`;

    const paiement = elevePaiements.find((p) => p.mois === moisKey);

    if (!paiement || paiement.statut === "impaye" || paiement.statut === "partiel") {
      moisImpayes++;
    } else {
      // Si un mois est payé, on arrête le compte consécutif
      break;
    }
  }

  return moisImpayes;
}

/**
 * Détermine si un élève doit être banni (2+ mois de retard)
 */
export function doitEtreBanni(moisImpayes: number): boolean {
  return moisImpayes >= 2;
}

/**
 * Exécute le processus d'auto-ban pour tous les élèves
 * avec 2+ mois de paiements en retard
 */
export async function executerAutoBan(): Promise<{
  bannis: string[];
  avertis: string[];
}> {
  const now = new Date();
  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const paiementsSnap = await getDocs(collection(db, "paiements"));
  const elevesSnap = await getDocs(collection(db, "eleves"));

  const paiements: PaiementData[] = paiementsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Paiement, "id">),
  }));

  const eleves: EleveWithId[] = elevesSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Eleve),
  }));

  const bannis: string[] = [];
  const avertis: string[] = [];

  for (const eleve of eleves) {
    // Skip élèves déjà bannis ou inactifs
    if (eleve.isBanned || eleve.statut === "inactif") continue;

    const moisImpayes = countMoisImpayes(eleve.id, paiements, moisActuel);

    if (doitEtreBanni(moisImpayes)) {
      // BANNIR - 2+ mois de retard
      await updateEleveSystem(eleve.id, {
        isBanned: true,
        banReason: `${moisImpayes} mois de paiements en retard`,
        banDate: serverTimestamp() as Eleve["banDate"],
      });

      await notifyAdmin({
        type: "ban",
        eleveId: eleve.id,
        message: `Élève ${eleve.prenom} ${eleve.nom} banni automatiquement : ${moisImpayes} mois de retard`,
      });

      bannis.push(eleve.id);
    } else if (moisImpayes === 1) {
      // AVERTISSEMENT - 1 mois de retard
      await notifyAdmin({
        type: "paiement",
        eleveId: eleve.id,
        message: `Attention : ${eleve.prenom} ${eleve.nom} a 1 mois de retard de paiement`,
      });

      avertis.push(eleve.id);
    }
  }

  return { bannis, avertis };
}

/**
 * Obtient les élèves à risque de ban (1 mois de retard)
 */
export async function getElevesRisqueBan(): Promise<
  Array<{
    id: string;
    nom: string;
    prenom: string;
    classe: string;
    moisImpayes: number;
  }>
> {
  const now = new Date();
  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const paiementsSnap = await getDocs(collection(db, "paiements"));
  const elevesSnap = await getDocs(collection(db, "eleves"));

  const paiements: PaiementData[] = paiementsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Paiement, "id">),
  }));

  const eleves: EleveWithId[] = elevesSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Eleve),
  }));

  const result: Array<{
    id: string;
    nom: string;
    prenom: string;
    classe: string;
    moisImpayes: number;
  }> = [];

  for (const eleve of eleves) {
    if (eleve.isBanned || eleve.statut === "inactif") continue;

    const moisImpayes = countMoisImpayes(eleve.id, paiements, moisActuel);

    if (moisImpayes >= 1) {
      result.push({
        id: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        classe: eleve.classe,
        moisImpayes,
      });
    }
  }

  return result.sort((a, b) => b.moisImpayes - a.moisImpayes);
}
