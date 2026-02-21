import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const updateAdmission = functions
  .region("europe-west1")
  .https.onCall(async (data: { id: string; statut: string; rejectReason?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Acces refuse.");
    requireArgument(!!data.id, "ID requis.");
    requireArgument(["nouveau", "en_revue", "accepte", "refuse"].includes(data.statut), "Statut invalide.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("admissions").doc(data.id);
      const snap = await ref.get();
      if (!snap.exists) notFound("Candidature non trouvee.");

      const admData = snap.data()!;
      if (admData.schoolId !== schoolId) {
        throw new functions.https.HttpsError("permission-denied", "Cette candidature n'appartient pas a votre ecole.");
      }

      const updates: Record<string, unknown> = {
        statut: data.statut,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth!.uid,
      };

      if (data.statut === "refuse" && data.rejectReason) {
        updates.rejectReason = data.rejectReason;
      }

      // If accepted, create the student
      if (data.statut === "accepte") {
        await db.collection("eleves").add({
          nom: admData.eleveNom,
          prenom: admData.elevePrenom,
          dateNaissance: admData.dateNaissance || null,
          classe: admData.classe,
          sexe: "",
          statut: "actif",
          schoolId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "admission",
          admissionId: data.id,
        });
      }

      await ref.update(updates);
      return { success: true, message: `Candidature ${data.statut === "accepte" ? "acceptee" : data.statut === "refuse" ? "refusee" : "mise a jour"}.` };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour de la candidature.");
    }
  });
