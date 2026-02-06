import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";

export const getAllCahierEntries = functions
  .region("europe-west1")
  .https.onCall(async (_data: unknown, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent acceder au cahier de texte complet.");

    try {
      const [cahierSnap, elevesSnap] = await Promise.all([
        db.collection("cahier").orderBy("date", "desc").get(),
        db.collection("eleves").get(),
      ]);

      const elevesMap = new Map<string, { nom: string; prenom: string; classe: string }>();
      elevesSnap.docs.forEach((doc) => {
        const d = doc.data();
        elevesMap.set(doc.id, {
          nom: d.nom || "",
          prenom: d.prenom || "",
          classe: d.classe || "",
        });
      });

      const entries = cahierSnap.docs.map((doc) => {
        const d = doc.data();
        const elevesDetails = (d.eleves || []).map((eleveId: string) => {
          const eleve = elevesMap.get(eleveId);
          return {
            id: eleveId,
            nom: eleve?.nom || "",
            prenom: eleve?.prenom || "",
            nomComplet: eleve ? `${eleve.prenom} ${eleve.nom}`.trim() : eleveId,
          };
        });

        return {
          id: doc.id,
          date: d.date || "",
          classe: d.classe || "",
          coursId: d.coursId || "",
          profId: d.profId || "",
          profNom: d.profNom || "",
          contenu: d.contenu || "",
          devoirs: d.devoirs || "",
          isSigned: d.isSigned || false,
          signedAt: d.signedAt?.toDate?.()?.toISOString() || null,
          eleves: d.eleves || [],
          elevesDetails,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        };
      });

      return { success: true, entries };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation du cahier de texte.");
    }
  });
