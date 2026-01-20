import { collection, getDocs } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { updateEleve } from "../eleves/eleve.service";
import { notifyAdmin } from "../notifications/alert.service";

export async function banElevesNonPayesApres10() {
  const now = new Date();
  const day = now.getDate();
  if (day < 10) return; // on ne déclenche qu’après le 10

  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const paiementsSnap = await getDocs(collection(db, "paiements"));
  const elevesSnap = await getDocs(collection(db, "eleves"));

  const paiements = paiementsSnap.docs.map((d: any) => d.data());
  const eleves = elevesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];

  for (const eleve of eleves) {
    const paiementMois = paiements.find(
      (p: any) => p.eleveId === eleve.id && p.mois === moisActuel
    );

    if (!paiementMois) {
      // 🔒 BANNI
      await updateEleve(eleve.id, {
        isBanned: true,
        banReason: "Non paiement avant le 10",
        banDate: serverTimestamp(),
      });

      await notifyAdmin({
        type: "ban",
        eleveId: eleve.id,
        message: `Élève ${eleve.nom} ${eleve.prenom} banni : non paiement mois ${moisActuel}`,
      });
    }
  }
}
