import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { isValidDate, isValidMonth, isNonNegativeNumber } from "../../helpers/validation";

interface CreatePaiementData {
  eleveId: string;
  mois: string;
  montantTotal: number;
  montantPaye: number;
  datePaiement: string;
}

export const createPaiement = functions
  .region("europe-west1")
  .https.onCall(async (data: CreatePaiementData, context) => {
    requireAuth(context.auth?.uid);
    const isAuthorized = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAuthorized, "Vous n'avez pas les droits pour creer un paiement.");

    requireArgument(!!data.eleveId && !!data.mois, "Eleve et mois sont requis.");
    requireArgument(!!data.datePaiement, "La date de paiement est requise.");
    requireArgument(isValidDate(data.datePaiement), "Format de date de paiement invalide (attendu: YYYY-MM-DD).");
    requireArgument(isValidMonth(data.mois), "Format de mois invalide (attendu: YYYY-MM).");
    requireArgument(isNonNegativeNumber(data.montantTotal) && isNonNegativeNumber(data.montantPaye), "Les montants ne peuvent pas etre negatifs.");
    requireArgument(data.montantPaye <= data.montantTotal, "Le montant paye ne peut pas depasser le montant total.");

    const eleveDoc = await db.collection("eleves").doc(data.eleveId).get();
    if (!eleveDoc.exists) notFound("Eleve non trouve.");

    const eleveData = eleveDoc.data();

    const existingPaiement = await db.collection("paiements")
      .where("eleveId", "==", data.eleveId)
      .where("mois", "==", data.mois)
      .get();

    if (!existingPaiement.empty) {
      throw new functions.https.HttpsError("already-exists", "Un paiement existe deja pour cet eleve ce mois.");
    }

    const montantRestant = data.montantTotal - data.montantPaye;
    let statut: "paye" | "partiel" | "impaye" = "impaye";
    if (montantRestant === 0) statut = "paye";
    else if (data.montantPaye > 0) statut = "partiel";

    // FIX C1: statut eleve conditionnel — "a_jour" seulement si totalement paye
    const statutEleve = montantRestant === 0 ? "a_jour" : "non_a_jour";

    try {
      const datePaiementParsed = new Date(data.datePaiement);

      // Générer une référence unique PAY-YYYYMM-XXXX
      const moisClean = data.mois.replace("-", "");
      const countSnap = await db.collection("paiements")
        .where("mois", "==", data.mois)
        .get();
      const seq = String(countSnap.size + 1).padStart(4, "0");
      const reference = `PAY-${moisClean}-${seq}`;

      // Fetch creator name
      const creatorDoc = await db.collection("users").doc(context.auth!.uid).get();
      const creatorData = creatorDoc.exists ? creatorDoc.data() : null;
      const createdByName = creatorData
        ? `${creatorData.prenom || ""} ${creatorData.nom || ""}`.trim() || creatorData.email || context.auth!.uid
        : context.auth!.uid;

      const paiementRef = await db.collection("paiements").add({
        eleveId: data.eleveId,
        eleveNom: `${eleveData?.prenom || ""} ${eleveData?.nom || ""}`.trim(),
        reference,
        mois: data.mois,
        montantTotal: data.montantTotal,
        montantPaye: data.montantPaye,
        montantRestant,
        statut,
        datePaiement: admin.firestore.Timestamp.fromDate(datePaiementParsed),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth!.uid,
        createdByName,
      });

      await db.collection("eleves").doc(data.eleveId).update({
        statutPaiementMensuel: statutEleve,
        dernierMoisPaye: data.mois,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("audit_logs").add({
        action: "PAIEMENT_CREATED",
        paiementId: paiementRef.id,
        eleveId: data.eleveId,
        montant: data.montantTotal,
        performedBy: context.auth!.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: paiementRef.id, message: "Paiement cree avec succes." };
    } catch (error) {
      handleError(error, "Erreur lors de la creation du paiement.");
    }
  });
