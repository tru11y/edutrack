import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

interface EleveRisk {
  eleveId: string;
  nom: string;
  prenom: string;
  classe: string;
  tauxAbsence: number;
  retards: number;
}

export async function getElevesARisque(): Promise<EleveRisk[]> {
  const elevesSnap = await getDocs(collection(db, "eleves"));
  const presencesSnap = await getDocs(collection(db, "presences"));

  const presences = presencesSnap.docs.map(d => d.data());

  const result: EleveRisk[] = [];

  elevesSnap.forEach((doc) => {
    const eleve = { id: doc.id, ...doc.data() } as any;

    const historiques = presences.filter((p: any) =>
      p.presences?.some((x: any) => x.eleveId === eleve.id)
    );

    let total = 0;
    let absents = 0;
    let retards = 0;

    historiques.forEach((h: any) => {
      const p = h.presences.find((x: any) => x.eleveId === eleve.id);
      if (!p) return;

      total++;
      if (p.statut === "absent") absents++;
      if (p.statut === "retard") retards++;
    });

    if (total === 0) return;

    const tauxAbsence = Math.round((absents / total) * 100);

    if (tauxAbsence >= 30 || retards >= 3) {
      result.push({
        eleveId: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        classe: eleve.classe,
        tauxAbsence,
        retards,
      });
    }
  });

  return result;
}
