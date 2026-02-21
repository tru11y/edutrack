import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

const VALID_TYPES = ["exclusion", "retard_grave", "impaye", "absence", "indiscipline", "fraude", "autre"];

export const createDisciplineRecord = functions
  .region("europe-west1")
  .https.onCall(async (data: Record<string, unknown>, context) => {
    requireAuth(context.auth?.uid);
    const isStaff = await verifyStaff(context.auth!.uid);
    requirePermission(isStaff, "Seul le staff peut creer un incident.");

    const schoolId = await getSchoolId(context.auth!.uid);

    const { eleveId, eleveNom, elevePrenom, classe, type, description, motif, sanction, coursId, coursDate } = data;

    requireArgument(typeof eleveId === "string" && eleveId.length > 0, "eleveId requis.");
    requireArgument(typeof eleveNom === "string" && eleveNom.length > 0, "eleveNom requis.");
    requireArgument(typeof elevePrenom === "string" && elevePrenom.length > 0, "elevePrenom requis.");
    requireArgument(typeof classe === "string" && classe.length > 0, "classe requise.");
    requireArgument(typeof type === "string" && VALID_TYPES.includes(type), "Type d'incident invalide.");
    requireArgument(typeof description === "string" && description.length > 0, "Description requise.");

    try {
      const userSnap = await db.collection("users").doc(context.auth!.uid).get();
      const userData = userSnap.data();
      const profNom = userData?.prenom && userData?.nom ? `${userData.prenom} ${userData.nom}` : userData?.email || "Staff";

      const record = {
        eleveId,
        eleveNom,
        elevePrenom,
        classe,
        type,
        description,
        motif: motif || "",
        sanction: sanction || "",
        coursId: coursId || "",
        coursDate: coursDate || "",
        profId: context.auth!.uid,
        profNom,
        isSystem: false,
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const ref = await db.collection("discipline").add(record);
      return { success: true, id: ref.id, message: "Incident enregistre." };
    } catch (error) {
      handleError(error, "Erreur lors de la creation de l'incident.");
    }
  });
