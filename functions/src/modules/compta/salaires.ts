import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { isValidMonth, isValidDate, isPositiveNumber, VALID_SALARY_STATUTS } from "../../helpers/validation";

interface CreateSalaireData {
  profId: string;
  mois: string;
  montant: number;
  statut: "paye" | "non_paye";
  datePaiement?: string;
}

export const createSalaire = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateSalaireData, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent creer des salaires.");

    requireArgument(!!data.profId && !!data.mois, "Professeur et mois sont requis.");
    requireArgument(isPositiveNumber(data.montant), "Le montant doit etre un nombre positif.");
    requireArgument(isValidMonth(data.mois), "Format de mois invalide (attendu: YYYY-MM).");
    requireArgument(VALID_SALARY_STATUTS.includes(data.statut), "Statut invalide (paye ou non_paye).");

    if (data.datePaiement) {
      requireArgument(isValidDate(data.datePaiement), "Format de date de paiement invalide (attendu: YYYY-MM-DD).");
    }

    const profDoc = await db.collection("professeurs").doc(data.profId).get();
    if (!profDoc.exists) notFound("Professeur non trouve.");

    const existing = await db.collection("salaires")
      .where("profId", "==", data.profId)
      .where("mois", "==", data.mois)
      .get();

    if (!existing.empty) {
      throw new functions.https.HttpsError("already-exists", "Un salaire existe deja pour ce professeur ce mois.");
    }

    const profData = profDoc.data();

    try {
      const salaireData: Record<string, unknown> = {
        profId: data.profId,
        profNom: `${profData?.prenom || ""} ${profData?.nom || ""}`.trim(),
        mois: data.mois,
        montant: data.montant,
        statut: data.statut,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth!.uid,
      };

      if (data.datePaiement) {
        salaireData.datePaiement = data.datePaiement;
      }

      const ref = await db.collection("salaires").add(salaireData);

      await db.collection("audit_logs").add({
        action: "SALAIRE_CREATED",
        salaireId: ref.id,
        profId: data.profId,
        montant: data.montant,
        performedBy: context.auth!.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Salaire cree avec succes." };
    } catch (error) {
      handleError(error, "Erreur lors de la creation du salaire.");
    }
  });

export const getSalaires = functions
  .region("europe-west1")
  .https.onCall(async (data: { mois?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent voir les salaires.");

    try {
      let query: FirebaseFirestore.Query = db.collection("salaires").orderBy("mois", "desc");

      if (data?.mois) {
        query = db.collection("salaires")
          .where("mois", "==", data.mois)
          .orderBy("profNom", "asc");
      }

      const snap = await query.get();

      const salaires = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          profId: d.profId || "",
          profNom: d.profNom || "",
          mois: d.mois || "",
          montant: d.montant || 0,
          statut: d.statut || "non_paye",
          datePaiement: d.datePaiement || null,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        };
      });

      return { success: true, salaires };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des salaires.");
    }
  });

export const updateSalaireStatut = functions
  .region("europe-west1")
  .https.onCall(async (data: { salaireId: string; statut: "paye" | "non_paye"; datePaiement?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent modifier les salaires.");
    requireArgument(!!data.salaireId && !!data.statut, "ID du salaire et statut sont requis.");

    try {
      const docSnap = await db.collection("salaires").doc(data.salaireId).get();
      if (!docSnap.exists) notFound("Salaire non trouve.");

      const updateData: Record<string, unknown> = {
        statut: data.statut,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth!.uid,
      };

      if (data.statut === "paye" && data.datePaiement) {
        updateData.datePaiement = data.datePaiement;
      }

      await db.collection("salaires").doc(data.salaireId).update(updateData);

      return { success: true, message: "Statut du salaire mis a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour du salaire.");
    }
  });
