import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { isValidDate, isPositiveNumber } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

const VALID_METHODES = ["especes", "mobile_money", "virement", "cheque"] as const;

interface AjouterVersementData {
  paiementId: string;
  montant: number;
  methode: typeof VALID_METHODES[number];
  datePaiement: string;
}

export const ajouterVersement = functions
  .region("europe-west1")
  .https.onCall(async (data: AjouterVersementData, context) => {
    requireAuth(context.auth?.uid);
    const isAuthorized = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAuthorized, "Seuls les administrateurs et gestionnaires peuvent ajouter des versements.");
    const schoolId = await getSchoolId(context.auth!.uid);

    requireArgument(!!data.paiementId, "paiementId est requis.");
    requireArgument(isPositiveNumber(data.montant), "Le montant doit etre un nombre positif.");
    requireArgument(
      VALID_METHODES.includes(data.methode),
      "Methode de paiement invalide."
    );
    requireArgument(isValidDate(data.datePaiement), "Format de date invalide (attendu: YYYY-MM-DD).");

    const paiementRef = db.collection("paiements").doc(data.paiementId);

    try {
      await db.runTransaction(async (transaction) => {
        const paiementDoc = await transaction.get(paiementRef);
        if (!paiementDoc.exists) notFound("Paiement non trouve.");

        const paiementData = paiementDoc.data()!;
        const montantTotal = paiementData.montantTotal || 0;
        const ancienPaye = paiementData.montantPaye || 0;
        const nouveauPaye = ancienPaye + data.montant;

        // Pas de surpaiement
        if (nouveauPaye > montantTotal) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            `Le versement depasse le montant total. Reste a payer: ${montantTotal - ancienPaye} FCFA.`
          );
        }

        const montantRestant = Math.max(montantTotal - nouveauPaye, 0);

        let statut: "paye" | "partiel" | "impaye";
        if (nouveauPaye === 0) statut = "impaye";
        else if (nouveauPaye < montantTotal) statut = "partiel";
        else statut = "paye";

        // Fetch creator name
        const creatorDoc = await transaction.get(db.collection("users").doc(context.auth!.uid));
        const creatorData = creatorDoc.exists ? creatorDoc.data() : null;
        const createdByName = creatorData
          ? `${creatorData.prenom || ""} ${creatorData.nom || ""}`.trim() || creatorData.email || context.auth!.uid
          : context.auth!.uid;

        const versements = paiementData.versements || [];
        versements.push({
          montant: data.montant,
          methode: data.methode,
          date: admin.firestore.Timestamp.fromDate(new Date(data.datePaiement)),
          createdBy: context.auth!.uid,
          createdByName,
        });

        transaction.update(paiementRef, {
          montantPaye: nouveauPaye,
          montantRestant,
          statut,
          datePaiement: admin.firestore.Timestamp.fromDate(new Date(data.datePaiement)),
          versements,
        });

        // Unban seulement si AUCUN mois impaye restant
        if (montantRestant <= 0) {
          const eleveId = paiementData.eleveId;
          if (eleveId) {
            const allPaiements = await db.collection("paiements")
              .where("eleveId", "==", eleveId)
              .get();

            const hasUnpaid = allPaiements.docs.some((doc) => {
              if (doc.id === data.paiementId) return false;
              const p = doc.data();
              return p.statut !== "paye";
            });

            if (!hasUnpaid) {
              const eleveRef = db.collection("eleves").doc(eleveId);
              transaction.update(eleveRef, {
                isBanned: false,
                banReason: null,
                banDate: null,
              });
            }
          }
        }

        // Audit log
        const auditRef = db.collection("audit_logs").doc();
        transaction.set(auditRef, {
          action: "VERSEMENT_AJOUTE",
          paiementId: data.paiementId,
          eleveId: paiementData.eleveId,
          montant: data.montant,
          methode: data.methode,
          nouveauStatut: statut,
          performedBy: context.auth!.uid,
          schoolId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return { success: true, message: "Versement enregistre avec succes." };
    } catch (error) {
      handleError(error, "Erreur lors de l'ajout du versement.");
    }
  });
