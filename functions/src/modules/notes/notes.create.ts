import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, notFound, handleError } from "../../helpers/errors";
import { isValidNote } from "../../helpers/validation";
import { getSchoolId } from "../../helpers/tenant";

interface CreateNoteData {
  evaluationId: string;
  eleveId: string;
  eleveNom: string;
  note: number;
  commentaire?: string;
  absence?: boolean;
}

interface CreateNotesBatchData {
  evaluationId: string;
  notes: Array<{
    eleveId: string;
    eleveNom: string;
    note: number;
    commentaire?: string;
    absence?: boolean;
  }>;
}

export const createNote = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateNoteData, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut saisir des notes.");
    const schoolId = await getSchoolId(context.auth!.uid);

    requireArgument(!!data.evaluationId, "L'ID de l'evaluation est requis.");
    requireArgument(!!data.eleveId, "L'ID de l'eleve est requis.");
    requireArgument(!!data.eleveNom, "Le nom de l'eleve est requis.");

    const evalSnap = await db.collection("evaluations").doc(data.evaluationId).get();
    if (!evalSnap.exists) notFound("Evaluation non trouvee.");

    const maxNote = evalSnap.data()!.maxNote;
    if (!data.absence) {
      requireArgument(
        isValidNote(data.note, maxNote),
        `La note doit etre entre 0 et ${maxNote}.`
      );
    }

    try {
      const ref = await db.collection("notes").add({
        evaluationId: data.evaluationId,
        eleveId: data.eleveId,
        eleveNom: data.eleveNom,
        note: data.absence ? 0 : data.note,
        commentaire: data.commentaire || "",
        absence: data.absence || false,
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Note enregistree." };
    } catch (error) {
      handleError(error, "Erreur lors de l'enregistrement de la note.");
    }
  });

export const createNotesBatch = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateNotesBatchData, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut saisir des notes.");
    const schoolId = await getSchoolId(context.auth!.uid);

    requireArgument(!!data.evaluationId, "L'ID de l'evaluation est requis.");
    requireArgument(
      Array.isArray(data.notes) && data.notes.length > 0,
      "Le tableau de notes est requis."
    );

    const evalSnap = await db.collection("evaluations").doc(data.evaluationId).get();
    if (!evalSnap.exists) notFound("Evaluation non trouvee.");

    const maxNote = evalSnap.data()!.maxNote;

    for (const entry of data.notes) {
      requireArgument(!!entry.eleveId, "eleveId requis pour chaque note.");
      requireArgument(!!entry.eleveNom, "eleveNom requis pour chaque note.");
      if (!entry.absence) {
        requireArgument(
          isValidNote(entry.note, maxNote),
          `Note invalide pour ${entry.eleveNom}: doit etre entre 0 et ${maxNote}.`
        );
      }
    }

    try {
      // Delete existing notes for this evaluation first
      const existingNotes = await db.collection("notes")
        .where("evaluationId", "==", data.evaluationId)
        .get();

      const batch = db.batch();
      existingNotes.docs.forEach((doc) => batch.delete(doc.ref));

      for (const entry of data.notes) {
        const ref = db.collection("notes").doc();
        batch.set(ref, {
          evaluationId: data.evaluationId,
          eleveId: entry.eleveId,
          eleveNom: entry.eleveNom,
          note: entry.absence ? 0 : entry.note,
          commentaire: entry.commentaire || "",
          absence: entry.absence || false,
          schoolId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      return { success: true, message: `${data.notes.length} notes enregistrees.` };
    } catch (error) {
      handleError(error, "Erreur lors de l'enregistrement des notes en lot.");
    }
  });
