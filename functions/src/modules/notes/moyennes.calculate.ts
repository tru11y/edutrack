import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";

interface CalculateMoyennesData {
  eleveId: string;
  trimestre: number;
}

interface MoyenneMatiere {
  matiere: string;
  moyenne: number;
  totalCoef: number;
  notes: Array<{
    titre: string;
    note: number;
    maxNote: number;
    coefficient: number;
    type: string;
    absence: boolean;
  }>;
}

export const calculateMoyennes = functions
  .region("europe-west1")
  .https.onCall(async (data: CalculateMoyennesData, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut calculer les moyennes.");
    requireArgument(!!data.eleveId, "L'ID de l'eleve est requis.");
    requireArgument(
      [1, 2, 3].includes(data.trimestre),
      "Trimestre invalide."
    );

    try {
      // Get all notes for this student
      const notesSnap = await db.collection("notes")
        .where("eleveId", "==", data.eleveId)
        .get();

      // Get associated evaluations
      const evalIds = [...new Set(notesSnap.docs.map((d) => d.data().evaluationId))];
      const evalMap: Record<string, FirebaseFirestore.DocumentData> = {};

      for (const evalId of evalIds) {
        const evalSnap = await db.collection("evaluations").doc(evalId).get();
        if (evalSnap.exists && evalSnap.data()!.trimestre === data.trimestre) {
          evalMap[evalId] = evalSnap.data()!;
        }
      }

      // Group notes by matiere
      const matiereMap: Record<string, MoyenneMatiere> = {};

      for (const doc of notesSnap.docs) {
        const noteData = doc.data();
        const evalData = evalMap[noteData.evaluationId];
        if (!evalData) continue;

        const matiere = evalData.matiere;
        if (!matiereMap[matiere]) {
          matiereMap[matiere] = { matiere, moyenne: 0, totalCoef: 0, notes: [] };
        }

        matiereMap[matiere].notes.push({
          titre: evalData.titre,
          note: noteData.note,
          maxNote: evalData.maxNote,
          coefficient: evalData.coefficient,
          type: evalData.type,
          absence: noteData.absence || false,
        });
      }

      // Calculate moyennes per matiere
      for (const key of Object.keys(matiereMap)) {
        const matiere = matiereMap[key];
        let totalPondere = 0;
        let totalCoef = 0;

        for (const note of matiere.notes) {
          if (!note.absence) {
            // Normalize to /20
            const noteOn20 = (note.note / note.maxNote) * 20;
            totalPondere += noteOn20 * note.coefficient;
            totalCoef += note.coefficient;
          }
        }

        matiere.moyenne = totalCoef > 0
          ? Math.round((totalPondere / totalCoef) * 100) / 100
          : 0;
        matiere.totalCoef = totalCoef;
      }

      // Calculate moyenne generale
      const matieres = Object.values(matiereMap);
      let totalMoyenne = 0;
      let nbMatieres = 0;
      for (const m of matieres) {
        if (m.totalCoef > 0) {
          totalMoyenne += m.moyenne;
          nbMatieres++;
        }
      }
      const moyenneGenerale = nbMatieres > 0
        ? Math.round((totalMoyenne / nbMatieres) * 100) / 100
        : 0;

      return {
        success: true,
        moyennes: matieres,
        moyenneGenerale,
      };
    } catch (error) {
      handleError(error, "Erreur lors du calcul des moyennes.");
    }
  });
