import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { requireArgument, handleError } from "../../helpers/errors";

interface AdmissionData {
  schoolId: string;
  eleveNom: string;
  elevePrenom: string;
  dateNaissance?: string;
  classe: string;
  parentNom: string;
  parentEmail: string;
  parentTelephone: string;
  documents?: string[];
  notes?: string;
}

/**
 * Public endpoint — no auth required (parents submit applications).
 */
export const createAdmission = functions
  .region("europe-west1")
  .https.onCall(async (data: AdmissionData) => {
    requireArgument(!!data.schoolId, "schoolId requis.");
    requireArgument(!!data.eleveNom && !!data.elevePrenom, "Nom et prenom de l'eleve requis.");
    requireArgument(!!data.classe, "Classe souhaitee requise.");
    requireArgument(!!data.parentNom && !!data.parentEmail, "Coordonnees du parent requises.");

    try {
      const ref = await db.collection("admissions").add({
        schoolId: data.schoolId,
        eleveNom: data.eleveNom,
        elevePrenom: data.elevePrenom,
        dateNaissance: data.dateNaissance || null,
        classe: data.classe,
        parentNom: data.parentNom,
        parentEmail: data.parentEmail,
        parentTelephone: data.parentTelephone || "",
        documents: data.documents || [],
        notes: data.notes || "",
        statut: "nouveau",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Candidature soumise avec succes." };
    } catch (error) {
      handleError(error, "Erreur lors de la soumission de la candidature.");
    }
  });
