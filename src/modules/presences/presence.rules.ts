import { getEleveById, updateEleve } from "../eleves/eleve.service";
import { getPresenceHistoryForEleve } from "./presence.service";
import { getPaiementsByEleve } from "../paiements/paiement.service";
import { notifyAdmin } from "../notifications/alert.service";
import type { PresenceCoursPayload, PresenceItem } from "./presence.types";

export async function computeStatutMetier(eleveId: string) {
  const eleve = await getEleveById(eleveId);

  if (eleve?.isBanned) {
    return {
      statutMetier: "banni",
      facturable: false,
      message: "Élève banni (paiement requis)",
    };
  }

  const history = await getPresenceHistoryForEleve(eleveId);
  const nbPresences = history.filter((p: PresenceCoursPayload) =>
    p.presences?.some((x: PresenceItem) => x.eleveId === eleveId && x.statut === "present")
  ).length;

  if (nbPresences < 2) {
    return {
      statutMetier: "essai",
      facturable: false,
      message: "Séance d'essai",
    };
  }

  const paiements = await getPaiementsByEleve(eleveId);
  const paiementActif = paiements.find((p) => p.statut !== "paye");

  if (paiementActif) {
    return {
      statutMetier: "a_renvoyer",
      facturable: false,
      message: "Paiement requis",
    };
  }

  return {
    statutMetier: "autorise",
    facturable: true,
    message: "Autorisé",
  };
}

export async function banEleve(eleveId: string) {
  await updateEleve(eleveId, {
    isBanned: true,
    banReason: "Non paiement",

  });

  await notifyAdmin({
    type: "ban",
    eleveId,
    message: "Élève exclu pour non-paiement",
  });
}
