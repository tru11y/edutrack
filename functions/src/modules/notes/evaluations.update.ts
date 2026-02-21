import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyStaff, verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, notFound, handleError } from "../../helpers/errors";
import { VALID_EVALUATION_TYPES, VALID_TRIMESTRES, isValidDate } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

interface UpdateEvaluationData {
  id: string;
  classe?: string;
  matiere?: string;
  titre?: string;
  type?: "devoir" | "examen" | "interro";
  date?: string;
  trimestre?: 1 | 2 | 3;
  coefficient?: number;
  maxNote?: number;
}

export const updateEvaluation = functions
  .region("europe-west1")
  .https.onCall(async (data: UpdateEvaluationData, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut modifier des evaluations.");
    requireArgument(!!data.id, "L'ID de l'evaluation est requis.");

    const evalRef = db.collection("evaluations").doc(data.id);
    const evalSnap = await evalRef.get();
    if (!evalSnap.exists) notFound("Evaluation non trouvee.");

    const evalData = evalSnap.data()!;
    const schoolId = await getSchoolId(context.auth!.uid);
    if (evalData.schoolId && evalData.schoolId !== schoolId) {
      requirePermission(false, "Cette evaluation n'appartient pas a votre etablissement.");
    }
    const isAdminOrGest = await verifyAdminOrGestionnaire(context.auth!.uid);
    if (!isAdminOrGest && evalData.professeurId !== context.auth!.uid) {
      requirePermission(false, "Vous ne pouvez modifier que vos propres evaluations.");
    }

    const updates: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (data.classe) updates.classe = data.classe;
    if (data.matiere) updates.matiere = data.matiere;
    if (data.titre) updates.titre = data.titre;
    if (data.type) {
      requireArgument(
        VALID_EVALUATION_TYPES.includes(data.type as typeof VALID_EVALUATION_TYPES[number]),
        "Type invalide."
      );
      updates.type = data.type;
    }
    if (data.date) {
      requireArgument(isValidDate(data.date), "Date invalide.");
      updates.date = data.date;
    }
    if (data.trimestre !== undefined) {
      requireArgument(
        VALID_TRIMESTRES.includes(data.trimestre as typeof VALID_TRIMESTRES[number]),
        "Trimestre invalide."
      );
      updates.trimestre = data.trimestre;
    }
    if (data.coefficient !== undefined) {
      requireArgument(data.coefficient > 0, "Le coefficient doit etre positif.");
      updates.coefficient = data.coefficient;
    }
    if (data.maxNote !== undefined) {
      requireArgument(data.maxNote > 0, "La note maximale doit etre positive.");
      updates.maxNote = data.maxNote;
    }

    try {
      await evalRef.update(updates);
      return { success: true, message: "Evaluation mise a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour de l'evaluation.");
    }
  });
