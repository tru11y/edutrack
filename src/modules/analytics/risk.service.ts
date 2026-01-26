import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Eleve } from "../eleves/eleve.types";
import type { PresenceCoursPayload, PresenceItem } from "../presences/presence.types";

export interface EleveRisk {
  id: string;
  eleveId: string;
  nom: string;
  prenom: string;
  classe: string;
  tauxAbsence: number;
  retards: number;
  reason: string;
}

interface EleveWithId extends Eleve {
  id: string;
}

export async function getElevesARisque(): Promise<EleveRisk[]> {
  const elevesSnap = await getDocs(collection(db, "eleves"));
  const presencesSnap = await getDocs(collection(db, "presences"));

  const presences = presencesSnap.docs.map(d => d.data() as PresenceCoursPayload);

  const result: EleveRisk[] = [];

  elevesSnap.forEach((doc) => {
    const eleve: EleveWithId = { id: doc.id, ...(doc.data() as Eleve) };

    const historiques = presences.filter((p) =>
      p.presences?.some((x: PresenceItem) => x.eleveId === eleve.id)
    );

    let total = 0;
    let absents = 0;
    let retards = 0;

    historiques.forEach((h) => {
      const p = h.presences.find((x: PresenceItem) => x.eleveId === eleve.id);
      if (!p) return;

      total++;
      if (p.statut === "absent") absents++;
      if (p.statut === "retard") retards++;
    });

    if (total === 0) return;

    const tauxAbsence = Math.round((absents / total) * 100);

    if (tauxAbsence >= 30 || retards >= 3) {
      let reason = "";
      if (tauxAbsence >= 30) {
        reason = `${tauxAbsence}% d'absences`;
      } else if (retards >= 3) {
        reason = `${retards} retards`;
      }

      result.push({
        id: eleve.id,
        eleveId: eleve.id,
        nom: eleve.nom,
        prenom: eleve.prenom,
        classe: eleve.classe,
        tauxAbsence,
        retards,
        reason,
      });
    }
  });

  return result;
}
