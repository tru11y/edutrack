import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

interface GenerateBulletinData {
  eleveId: string;
  classe: string;
  trimestre: number;
  anneeScolaire: string;
  appreciationGenerale?: string;
}

interface GenerateBulletinsClasseData {
  classe: string;
  trimestre: number;
  anneeScolaire: string;
}

async function computeBulletinForEleve(
  eleveId: string,
  classe: string,
  trimestre: number,
  anneeScolaire: string,
  appreciationGenerale: string,
  schoolId: string
) {
  // Get all notes for this student
  const notesSnap = await db.collection("notes")
    .where("schoolId", "==", schoolId)
    .where("eleveId", "==", eleveId)
    .get();

  const evalIds = [...new Set(notesSnap.docs.map((d) => d.data().evaluationId))];
  const evalMap: Record<string, FirebaseFirestore.DocumentData> = {};

  for (const evalId of evalIds) {
    const evalSnap = await db.collection("evaluations").doc(evalId).get();
    if (evalSnap.exists && evalSnap.data()!.trimestre === trimestre) {
      evalMap[evalId] = evalSnap.data()!;
    }
  }

  // Group by matiere and calculate moyennes
  const matiereMap: Record<string, { totalPondere: number; totalCoef: number }> = {};

  for (const doc of notesSnap.docs) {
    const noteData = doc.data();
    const evalData = evalMap[noteData.evaluationId];
    if (!evalData) continue;
    if (noteData.absence) continue;

    const matiere = evalData.matiere;
    if (!matiereMap[matiere]) {
      matiereMap[matiere] = { totalPondere: 0, totalCoef: 0 };
    }

    const noteOn20 = (noteData.note / evalData.maxNote) * 20;
    matiereMap[matiere].totalPondere += noteOn20 * evalData.coefficient;
    matiereMap[matiere].totalCoef += evalData.coefficient;
  }

  const moyennesMatiere: Record<string, number> = {};
  let totalMoyenne = 0;
  let nbMatieres = 0;

  for (const [matiere, data] of Object.entries(matiereMap)) {
    if (data.totalCoef > 0) {
      const moy = Math.round((data.totalPondere / data.totalCoef) * 100) / 100;
      moyennesMatiere[matiere] = moy;
      totalMoyenne += moy;
      nbMatieres++;
    }
  }

  const moyenneGenerale = nbMatieres > 0
    ? Math.round((totalMoyenne / nbMatieres) * 100) / 100
    : 0;

  // Count absences and retards
  const presencesSnap = await db.collectionGroup("appels")
    .where("eleveId", "==", eleveId)
    .get();

  let absencesTotal = 0;
  let retardsTotal = 0;
  for (const doc of presencesSnap.docs) {
    const d = doc.data();
    if (d.statut === "absent") absencesTotal++;
    if (d.statut === "retard") retardsTotal++;
  }

  return {
    eleveId,
    classe,
    trimestre,
    anneeScolaire,
    schoolId,
    moyennesMatiere,
    moyenneGenerale,
    rang: 0, // Will be computed after all bulletins
    totalEleves: 0,
    absencesTotal,
    retardsTotal,
    appreciationGenerale,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

export const generateBulletin = functions
  .region("europe-west1")
  .https.onCall(async (data: GenerateBulletinData, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut generer des bulletins.");

    requireArgument(!!data.eleveId, "L'ID de l'eleve est requis.");
    requireArgument(!!data.classe, "La classe est requise.");
    requireArgument([1, 2, 3].includes(data.trimestre), "Trimestre invalide.");
    requireArgument(!!data.anneeScolaire, "L'annee scolaire est requise.");
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const bulletinData = await computeBulletinForEleve(
        data.eleveId,
        data.classe,
        data.trimestre,
        data.anneeScolaire,
        data.appreciationGenerale || "",
        schoolId
      );

      // Upsert bulletin
      const existing = await db.collection("bulletins")
        .where("schoolId", "==", schoolId)
        .where("eleveId", "==", data.eleveId)
        .where("trimestre", "==", data.trimestre)
        .where("anneeScolaire", "==", data.anneeScolaire)
        .get();

      let bulletinId: string;
      if (!existing.empty) {
        bulletinId = existing.docs[0].id;
        // Snapshot current version before updating
        const currentData = existing.docs[0].data();
        const versionsSnap = await db.collection("bulletins").doc(bulletinId).collection("versions").get();
        await db.collection("bulletins").doc(bulletinId).collection("versions").add({
          data: currentData,
          versionNumber: versionsSnap.size + 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: context.auth!.uid,
        });
        await db.collection("bulletins").doc(bulletinId).update(bulletinData);
      } else {
        const ref = await db.collection("bulletins").add(bulletinData);
        bulletinId = ref.id;
      }

      return { success: true, id: bulletinId, message: "Bulletin genere." };
    } catch (error) {
      handleError(error, "Erreur lors de la generation du bulletin.");
    }
  });

export const generateBulletinsClasse = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 300 })
  .https.onCall(async (data: GenerateBulletinsClasseData, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut generer des bulletins.");

    requireArgument(!!data.classe, "La classe est requise.");
    requireArgument([1, 2, 3].includes(data.trimestre), "Trimestre invalide.");
    requireArgument(!!data.anneeScolaire, "L'annee scolaire est requise.");
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      // Get all students in this class
      const elevesSnap = await db.collection("eleves")
        .where("classe", "==", data.classe)
        .where("statut", "==", "actif")
        .get();

      if (elevesSnap.empty) {
        return { success: true, count: 0, message: "Aucun eleve dans cette classe." };
      }

      const bulletins: Array<{ eleveId: string; moyenneGenerale: number; data: Record<string, unknown> }> = [];

      for (const eleveDoc of elevesSnap.docs) {
        const bulletinData = await computeBulletinForEleve(
          eleveDoc.id,
          data.classe,
          data.trimestre,
          data.anneeScolaire,
          "",
          schoolId
        );
        bulletins.push({
          eleveId: eleveDoc.id,
          moyenneGenerale: bulletinData.moyenneGenerale,
          data: bulletinData,
        });
      }

      // Calculate ranks
      bulletins.sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);
      const totalEleves = bulletins.length;

      for (let i = 0; i < bulletins.length; i++) {
        bulletins[i].data.rang = i + 1;
        bulletins[i].data.totalEleves = totalEleves;
      }

      // Save all bulletins
      const batch = db.batch();
      for (const bulletin of bulletins) {
        // Check if bulletin already exists
        const existing = await db.collection("bulletins")
          .where("schoolId", "==", schoolId)
          .where("eleveId", "==", bulletin.eleveId)
          .where("trimestre", "==", data.trimestre)
          .where("anneeScolaire", "==", data.anneeScolaire)
          .get();

        if (!existing.empty) {
          // Snapshot current version
          const currentData = existing.docs[0].data();
          const versionsSnap = await existing.docs[0].ref.collection("versions").get();
          await existing.docs[0].ref.collection("versions").add({
            data: currentData,
            versionNumber: versionsSnap.size + 1,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: context.auth!.uid,
          });
          batch.update(existing.docs[0].ref, bulletin.data);
        } else {
          const ref = db.collection("bulletins").doc();
          batch.set(ref, bulletin.data);
        }
      }

      await batch.commit();

      return {
        success: true,
        count: bulletins.length,
        message: `${bulletins.length} bulletins generes pour ${data.classe}.`,
      };
    } catch (error) {
      handleError(error, "Erreur lors de la generation des bulletins de la classe.");
    }
  });
