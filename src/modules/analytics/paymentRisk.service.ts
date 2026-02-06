import { collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { updateEleve } from "../eleves/eleve.service";
import { notifyAdmin } from "../notifications/alert.service";
import type { Eleve } from "../eleves/eleve.types";

interface PaiementDoc {
  eleveId: string;
  mois: string;
}

export async function banElevesNonPayesApres10() {
  const now = new Date();
  const day = now.getDate();
  if (day < 10) return;

  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const paiementsSnap = await getDocs(collection(db, "paiements"));
  const elevesSnap = await getDocs(collection(db, "eleves"));

  const paiements = paiementsSnap.docs.map((d) => d.data() as PaiementDoc);
  const eleves = elevesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Eleve & { id: string }));

  for (const eleve of eleves) {
    const paiementMois = paiements.find(
      (p) => p.eleveId === eleve.id && p.mois === moisActuel
    );

    if (!paiementMois) {
      await updateEleve(eleve.id, {
        isBanned: true,
        banReason: "Non paiement avant le 10",
        banDate: serverTimestamp() as Eleve["banDate"],
      });

      await notifyAdmin({
        type: "ban",
        eleveId: eleve.id,
        message: `Élève ${eleve.nom} ${eleve.prenom} banni : non paiement mois ${moisActuel}`,
      });
    }
  }
}
