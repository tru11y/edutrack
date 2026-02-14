import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { requireAuth, handleError } from "../../helpers/errors";

export const getNotesByEvaluation = functions
  .region("europe-west1")
  .https.onCall(async (data: { evaluationId: string }, context) => {
    requireAuth(context.auth?.uid);

    try {
      const snap = await db.collection("notes")
        .where("evaluationId", "==", data.evaluationId)
        .get();

      const notes = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
      }));

      return { success: true, notes };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des notes.");
    }
  });

export const getNotesByEleve = functions
  .region("europe-west1")
  .https.onCall(async (data: { eleveId: string; trimestre?: number }, context) => {
    requireAuth(context.auth?.uid);

    try {
      const notesSnap = await db.collection("notes")
        .where("eleveId", "==", data.eleveId)
        .get();

      const notes = notesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
      }));

      // Fetch associated evaluations to enrich the data
      const evalIds = [...new Set(notes.map((n: Record<string, unknown>) => n.evaluationId as string))];
      const evaluationsMap: Record<string, Record<string, unknown>> = {};

      for (const evalId of evalIds) {
        const evalSnap = await db.collection("evaluations").doc(evalId).get();
        if (evalSnap.exists) {
          evaluationsMap[evalId] = { id: evalId, ...evalSnap.data() };
        }
      }

      const enrichedNotes = notes
        .map((note: Record<string, unknown>) => {
          const evaluation = evaluationsMap[note.evaluationId as string];
          if (!evaluation) return null;
          if (data.trimestre && evaluation.trimestre !== data.trimestre) return null;
          return {
            ...note,
            evaluation: {
              titre: evaluation.titre,
              matiere: evaluation.matiere,
              type: evaluation.type,
              date: evaluation.date,
              trimestre: evaluation.trimestre,
              coefficient: evaluation.coefficient,
              maxNote: evaluation.maxNote,
            },
          };
        })
        .filter(Boolean);

      return { success: true, notes: enrichedNotes };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des notes de l'eleve.");
    }
  });
