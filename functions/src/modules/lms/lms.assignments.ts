import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyProf, verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const createAssignment = functions
  .region("europe-west1")
  .https.onCall(async (data: {
    titre: string; description: string; classe: string; matiere: string;
    dateLimite: string; fichierUrl?: string;
  }, context) => {
    requireAuth(context.auth?.uid);
    const isProf = await verifyProf(context.auth!.uid);
    const isAdmin = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isProf || isAdmin, "Acces refuse.");
    requireArgument(!!data.titre && !!data.classe && !!data.matiere && !!data.dateLimite, "Titre, classe, matiere et date limite requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = await db.collection("assignments").add({
        titre: data.titre,
        description: data.description || "",
        classe: data.classe,
        matiere: data.matiere,
        dateLimite: data.dateLimite,
        fichierUrl: data.fichierUrl || null,
        profId: context.auth!.uid,
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Devoir cree avec succes." };
    } catch (error) {
      handleError(error, "Erreur lors de la creation du devoir.");
    }
  });

export const listAssignments = functions
  .region("europe-west1")
  .https.onCall(async (data: { classe?: string; matiere?: string }, context) => {
    requireAuth(context.auth?.uid);
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      let query: FirebaseFirestore.Query = db.collection("assignments")
        .where("schoolId", "==", schoolId)
        .orderBy("createdAt", "desc");

      if (data?.classe) query = query.where("classe", "==", data.classe);
      if (data?.matiere) query = query.where("matiere", "==", data.matiere);

      const snap = await query.limit(200).get();
      const assignments = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      }));

      return { success: true, assignments };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des devoirs.");
    }
  });

export const submitAssignment = functions
  .region("europe-west1")
  .https.onCall(async (data: { assignmentId: string; fichierUrl?: string; contenu?: string }, context) => {
    requireAuth(context.auth?.uid);
    requireArgument(!!data.assignmentId, "ID du devoir requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const assignRef = db.collection("assignments").doc(data.assignmentId);
      const assignSnap = await assignRef.get();
      if (!assignSnap.exists) notFound("Devoir non trouve.");
      if (assignSnap.data()?.schoolId !== schoolId) notFound("Devoir non trouve.");

      const userDoc = await db.collection("users").doc(context.auth!.uid).get();
      const userData = userDoc.data();

      const ref = await db.collection("submissions").add({
        assignmentId: data.assignmentId,
        eleveId: context.auth!.uid,
        eleveNom: `${userData?.prenom || ""} ${userData?.nom || ""}`.trim(),
        fichierUrl: data.fichierUrl || null,
        contenu: data.contenu || "",
        note: null,
        commentaire: null,
        statut: "soumis",
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Soumission enregistree." };
    } catch (error) {
      handleError(error, "Erreur lors de la soumission.");
    }
  });

export const gradeSubmission = functions
  .region("europe-west1")
  .https.onCall(async (data: { submissionId: string; note: number; commentaire?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isProf = await verifyProf(context.auth!.uid);
    const isAdmin = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isProf || isAdmin, "Acces refuse.");
    requireArgument(!!data.submissionId, "ID de la soumission requis.");
    requireArgument(typeof data.note === "number" && data.note >= 0, "Note invalide.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("submissions").doc(data.submissionId);
      const snap = await ref.get();
      if (!snap.exists) notFound("Soumission non trouvee.");
      if (snap.data()?.schoolId !== schoolId) notFound("Soumission non trouvee.");

      await ref.update({
        note: data.note,
        commentaire: data.commentaire || "",
        statut: "note",
        notePar: context.auth!.uid,
        noteAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Note attribuee." };
    } catch (error) {
      handleError(error, "Erreur lors de la notation.");
    }
  });
