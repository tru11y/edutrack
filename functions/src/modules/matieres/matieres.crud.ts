import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const getMatieres = functions
  .region("europe-west1")
  .https.onCall(async (_data: unknown, context) => {
    requireAuth(context.auth?.uid);

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const snap = await db.collection("matieres").where("schoolId", "==", schoolId).orderBy("nom").get();
      const matieres = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      }));
      return { success: true, matieres };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des matieres.");
    }
  });

export const createMatiere = functions
  .region("europe-west1")
  .https.onCall(async (data: Record<string, unknown>, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Seul l'admin ou gestionnaire peut gerer les matieres.");

    requireArgument(typeof data.nom === "string" && data.nom.length > 0, "Nom de la matiere requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const existing = await db.collection("matieres").where("schoolId", "==", schoolId).where("nom", "==", data.nom).get();
      if (!existing.empty) {
        throw new functions.https.HttpsError("already-exists", "Cette matiere existe deja.");
      }

      const ref = await db.collection("matieres").add({
        nom: data.nom,
        coefficient: typeof data.coefficient === "number" ? data.coefficient : 1,
        couleur: typeof data.couleur === "string" ? data.couleur : "#6366f1",
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, id: ref.id, message: "Matiere creee." };
    } catch (error) {
      handleError(error, "Erreur lors de la creation de la matiere.");
    }
  });

export const updateMatiere = functions
  .region("europe-west1")
  .https.onCall(async (data: Record<string, unknown>, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Seul l'admin ou gestionnaire peut gerer les matieres.");

    requireArgument(typeof data.id === "string", "ID requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("matieres").doc(data.id as string);
      const snap = await ref.get();
      if (!snap.exists) notFound("Matiere non trouvee.");
      if (snap.data()?.schoolId !== schoolId) notFound("Matiere non trouvee.");

      const updates: Record<string, unknown> = {};
      if (typeof data.nom === "string") updates.nom = data.nom;
      if (typeof data.coefficient === "number") updates.coefficient = data.coefficient;
      if (typeof data.couleur === "string") updates.couleur = data.couleur;

      await ref.update(updates);
      return { success: true, message: "Matiere mise a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour de la matiere.");
    }
  });

export const deleteMatiere = functions
  .region("europe-west1")
  .https.onCall(async (data: Record<string, unknown>, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Seul l'admin ou gestionnaire peut gerer les matieres.");

    requireArgument(typeof data.id === "string", "ID requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("matieres").doc(data.id as string);
      const snap = await ref.get();
      if (!snap.exists) notFound("Matiere non trouvee.");
      if (snap.data()?.schoolId !== schoolId) notFound("Matiere non trouvee.");

      await ref.delete();
      return { success: true, message: "Matiere supprimee." };
    } catch (error) {
      handleError(error, "Erreur lors de la suppression de la matiere.");
    }
  });
