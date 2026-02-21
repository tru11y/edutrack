import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, notFound, handleError } from "../../helpers/errors";
import { isValidNote } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

interface UpdateNoteData {
  id: string;
  note?: number;
  commentaire?: string;
  absence?: boolean;
}

export const updateNote = functions
  .region("europe-west1")
  .https.onCall(async (data: UpdateNoteData, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut modifier des notes.");
    requireArgument(!!data.id, "L'ID de la note est requis.");

    const noteRef = db.collection("notes").doc(data.id);
    const noteSnap = await noteRef.get();
    if (!noteSnap.exists) notFound("Note non trouvee.");

    const noteData = noteSnap.data()!;
    const schoolId = await getSchoolId(context.auth!.uid);
    if (noteData.schoolId && noteData.schoolId !== schoolId) {
      requirePermission(false, "Cette note n'appartient pas a votre etablissement.");
    }
    const evalSnap = await db.collection("evaluations").doc(noteData.evaluationId).get();
    if (!evalSnap.exists) notFound("Evaluation associee non trouvee.");

    const maxNote = evalSnap.data()!.maxNote;
    const updates: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (data.absence !== undefined) updates.absence = data.absence;
    if (data.commentaire !== undefined) updates.commentaire = data.commentaire;
    if (data.note !== undefined) {
      if (!data.absence) {
        requireArgument(
          isValidNote(data.note, maxNote),
          `La note doit etre entre 0 et ${maxNote}.`
        );
      }
      updates.note = data.absence ? 0 : data.note;
    }

    try {
      await noteRef.update(updates);
      return { success: true, message: "Note mise a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour de la note.");
    }
  });
