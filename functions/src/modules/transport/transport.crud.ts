import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const createRoute = functions
  .region("europe-west1")
  .https.onCall(async (data: { nom: string; arrets: string[]; chauffeur?: string; telephone?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Acces refuse.");
    requireArgument(!!data.nom, "Nom de la route requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = await db.collection("transport_routes").add({
        nom: data.nom,
        arrets: data.arrets || [],
        chauffeur: data.chauffeur || "",
        telephone: data.telephone || "",
        eleves: [],
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth!.uid,
      });

      return { success: true, id: ref.id, message: "Route creee avec succes." };
    } catch (error) {
      handleError(error, "Erreur lors de la creation de la route.");
    }
  });

export const updateRoute = functions
  .region("europe-west1")
  .https.onCall(async (data: { id: string; nom?: string; arrets?: string[]; chauffeur?: string; telephone?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Acces refuse.");
    requireArgument(!!data.id, "ID de la route requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("transport_routes").doc(data.id);
      const snap = await ref.get();
      if (!snap.exists) notFound("Route non trouvee.");
      if (snap.data()?.schoolId !== schoolId) notFound("Route non trouvee.");

      const updates: Record<string, unknown> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (data.nom !== undefined) updates.nom = data.nom;
      if (data.arrets !== undefined) updates.arrets = data.arrets;
      if (data.chauffeur !== undefined) updates.chauffeur = data.chauffeur;
      if (data.telephone !== undefined) updates.telephone = data.telephone;

      await ref.update(updates);
      return { success: true, message: "Route mise a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour de la route.");
    }
  });

export const deleteRoute = functions
  .region("europe-west1")
  .https.onCall(async (data: { id: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Acces refuse.");
    requireArgument(!!data.id, "ID de la route requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("transport_routes").doc(data.id);
      const snap = await ref.get();
      if (!snap.exists) notFound("Route non trouvee.");
      if (snap.data()?.schoolId !== schoolId) notFound("Route non trouvee.");

      await ref.delete();
      return { success: true, message: "Route supprimee." };
    } catch (error) {
      handleError(error, "Erreur lors de la suppression de la route.");
    }
  });

export const listRoutes = functions
  .region("europe-west1")
  .https.onCall(async (_data, context) => {
    requireAuth(context.auth?.uid);
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const snap = await db.collection("transport_routes")
        .where("schoolId", "==", schoolId)
        .orderBy("nom")
        .get();

      const routes = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, routes };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des routes.");
    }
  });

export const assignStudentToRoute = functions
  .region("europe-west1")
  .https.onCall(async (data: { routeId: string; eleveId: string; action: "add" | "remove" }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Acces refuse.");
    requireArgument(!!data.routeId && !!data.eleveId, "ID route et eleve requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("transport_routes").doc(data.routeId);
      const snap = await ref.get();
      if (!snap.exists) notFound("Route non trouvee.");
      if (snap.data()?.schoolId !== schoolId) notFound("Route non trouvee.");

      if (data.action === "add") {
        await ref.update({
          eleves: admin.firestore.FieldValue.arrayUnion(data.eleveId),
        });
      } else {
        await ref.update({
          eleves: admin.firestore.FieldValue.arrayRemove(data.eleveId),
        });
      }

      return { success: true, message: `Eleve ${data.action === "add" ? "ajoute a" : "retire de"} la route.` };
    } catch (error) {
      handleError(error, "Erreur lors de l'affectation.");
    }
  });
