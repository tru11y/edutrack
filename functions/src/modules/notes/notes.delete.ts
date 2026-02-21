import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, notFound, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const deleteNote = functions
  .region("europe-west1")
  .https.onCall(async (data: { id: string }, context) => {
    requireAuth(context.auth?.uid);
    const allowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(allowed, "Seuls les admins/gestionnaires peuvent supprimer des notes.");
    requireArgument(!!data.id, "L'ID de la note est requis.");

    const noteRef = db.collection("notes").doc(data.id);
    const noteSnap = await noteRef.get();
    if (!noteSnap.exists) notFound("Note non trouvee.");

    const schoolId = await getSchoolId(context.auth!.uid);
    const noteData = noteSnap.data()!;
    if (noteData.schoolId && noteData.schoolId !== schoolId) {
      requirePermission(false, "Cette note n'appartient pas a votre etablissement.");
    }

    try {
      await noteRef.delete();
      return { success: true, message: "Note supprimee." };
    } catch (error) {
      handleError(error, "Erreur lors de la suppression de la note.");
    }
  });
