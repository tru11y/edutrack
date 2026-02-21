import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { isValidDate, isValidMonth, isPositiveNumber, getLastDayOfMonth } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

interface CreateDepenseData {
  libelle: string;
  categorie: string;
  montant: number;
  date: string;
}

export const createDepense = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateDepenseData, context) => {
    requireAuth(context.auth?.uid);
    const isAuthorized = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAuthorized, "Seuls les administrateurs et gestionnaires peuvent creer des depenses.");

    requireArgument(!!data.libelle && !!data.categorie && !!data.date, "Libelle, categorie et date sont requis.");
    requireArgument(isPositiveNumber(data.montant), "Le montant doit etre un nombre positif.");
    requireArgument(isValidDate(data.date), "Format de date invalide (attendu: YYYY-MM-DD).");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = await db.collection("depenses").add({
        libelle: data.libelle,
        categorie: data.categorie,
        montant: data.montant,
        date: data.date,
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth!.uid,
      });

      await db.collection("audit_logs").add({
        action: "DEPENSE_CREATED",
        depenseId: ref.id,
        montant: data.montant,
        performedBy: context.auth!.uid,
        schoolId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Depense creee avec succes." };
    } catch (error) {
      handleError(error, "Erreur lors de la creation de la depense.");
    }
  });

// FIX C3: Firestore query par mois au lieu de fetch all + filter JS
export const getDepenses = functions
  .region("europe-west1")
  .https.onCall(async (data: { mois?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAuthorized = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAuthorized, "Seuls les administrateurs et gestionnaires peuvent voir les depenses.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      let snap;

      if (data?.mois) {
        requireArgument(isValidMonth(data.mois), "Format de mois invalide (attendu: YYYY-MM).");
        const startDate = `${data.mois}-01`;
        const endDate = getLastDayOfMonth(data.mois);
        snap = await db.collection("depenses")
          .where("schoolId", "==", schoolId)
          .where("date", ">=", startDate)
          .where("date", "<=", endDate)
          .orderBy("date", "desc")
          .get();
      } else {
        snap = await db.collection("depenses")
          .where("schoolId", "==", schoolId)
          .orderBy("date", "desc")
          .get();
      }

      const depenses = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          libelle: d.libelle || "",
          categorie: d.categorie || "",
          montant: d.montant || 0,
          date: d.date || "",
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
          createdBy: d.createdBy || "",
        };
      });

      return { success: true, depenses };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des depenses.");
    }
  });

export const deleteDepense = functions
  .region("europe-west1")
  .https.onCall(async (data: { depenseId: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAuthorized = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAuthorized, "Seuls les administrateurs et gestionnaires peuvent supprimer des depenses.");
    requireArgument(!!data.depenseId, "ID de la depense requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const docSnap = await db.collection("depenses").doc(data.depenseId).get();
      if (!docSnap.exists) notFound("Depense non trouvee.");
      if (docSnap.data()?.schoolId !== schoolId) notFound("Depense non trouvee.");

      await db.collection("depenses").doc(data.depenseId).delete();

      await db.collection("audit_logs").add({
        action: "DEPENSE_DELETED",
        depenseId: data.depenseId,
        performedBy: context.auth!.uid,
        schoolId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Depense supprimee." };
    } catch (error) {
      handleError(error, "Erreur lors de la suppression de la depense.");
    }
  });
