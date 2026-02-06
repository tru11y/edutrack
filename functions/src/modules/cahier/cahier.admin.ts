import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";

interface GetCahierTextesAdminParams {
  classe?: string;
  profId?: string;
  mois?: string;
}

export const getCahierTextesAdmin = functions
  .region("europe-west1")
  .https.onCall(async (data: GetCahierTextesAdminParams, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent acceder aux cahiers de texte.");

    try {
      let cahierQuery: FirebaseFirestore.Query = db.collection("cahier");

      if (data?.classe) {
        cahierQuery = cahierQuery.where("classe", "==", data.classe);
      }

      if (data?.profId) {
        cahierQuery = cahierQuery.where("profId", "==", data.profId);
      }

      cahierQuery = cahierQuery.orderBy("date", "desc").limit(50);

      const cahierSnap = await cahierQuery.get();

      let docs = cahierSnap.docs;
      if (data?.mois) {
        docs = docs.filter((doc) => {
          const date = doc.data().date as string;
          return date && date.startsWith(data.mois!);
        });
      }

      const profsSnap = await db.collection("professeurs").get();
      const profsMap = new Map<string, { nom: string; prenom: string }>();
      profsSnap.docs.forEach((doc) => {
        const d = doc.data();
        profsMap.set(doc.id, { nom: d.nom || "", prenom: d.prenom || "" });
      });

      const entries = docs.map((doc) => {
        const d = doc.data();
        const prof = profsMap.get(d.profId);
        const profNomComplet = prof
          ? `${prof.prenom} ${prof.nom}`.trim()
          : d.profNom || d.profId || "";

        return {
          id: doc.id,
          date: d.date || "",
          classe: d.classe || "",
          coursId: d.coursId || "",
          profId: d.profId || "",
          profNom: profNomComplet,
          contenu: d.contenu || "",
          devoirs: d.devoirs || "",
          isSigned: d.isSigned || false,
          signedAt: d.signedAt?.toDate?.()?.toISOString() || null,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        };
      });

      return { success: true, entries };
    } catch (error) {
      console.error("getCahierTextesAdmin error:", error);
      handleError(error, "Erreur lors de la recuperation des cahiers de texte.");
    }
  });
