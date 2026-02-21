import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { VALID_EVALUATION_TYPES, VALID_TRIMESTRES, isValidDate } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

interface CreateEvaluationData {
  classe: string;
  matiere: string;
  titre: string;
  type: "devoir" | "examen" | "interro";
  date: string;
  trimestre: 1 | 2 | 3;
  coefficient: number;
  maxNote: number;
}

export const createEvaluation = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateEvaluationData, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut creer des evaluations.");
    const schoolId = await getSchoolId(context.auth!.uid);

    requireArgument(!!data.classe, "La classe est requise.");
    requireArgument(!!data.matiere, "La matiere est requise.");
    requireArgument(!!data.titre, "Le titre est requis.");
    requireArgument(
      VALID_EVALUATION_TYPES.includes(data.type as typeof VALID_EVALUATION_TYPES[number]),
      "Type d'evaluation invalide."
    );
    requireArgument(isValidDate(data.date), "Date invalide.");
    requireArgument(
      VALID_TRIMESTRES.includes(data.trimestre as typeof VALID_TRIMESTRES[number]),
      "Trimestre invalide (1, 2 ou 3)."
    );
    requireArgument(
      typeof data.coefficient === "number" && data.coefficient > 0,
      "Le coefficient doit etre un nombre positif."
    );
    requireArgument(
      typeof data.maxNote === "number" && data.maxNote > 0,
      "La note maximale doit etre un nombre positif."
    );

    // Get professor info
    const userSnap = await db.collection("users").doc(context.auth!.uid).get();
    const userData = userSnap.data();
    const profNom = userData?.prenom && userData?.nom
      ? `${userData.prenom} ${userData.nom}`
      : userData?.email || "Inconnu";

    try {
      const ref = await db.collection("evaluations").add({
        classe: data.classe,
        matiere: data.matiere,
        titre: data.titre,
        type: data.type,
        date: data.date,
        trimestre: data.trimestre,
        coefficient: data.coefficient,
        maxNote: data.maxNote,
        professeurId: context.auth!.uid,
        professeurNom: profNom,
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Evaluation creee." };
    } catch (error) {
      handleError(error, "Erreur lors de la creation de l'evaluation.");
    }
  });
