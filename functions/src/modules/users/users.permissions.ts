import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { getUserPermissions } from "../../helpers/permissions";
import { getSchoolId } from "../../helpers/tenant";

export const getUserPermissionsFunction = functions
  .region("europe-west1")
  .https.onCall(async (data: { userId: string }, context) => {
    requireAuth(context.auth?.uid);
    const admin = await verifyAdmin(context.auth!.uid);
    requirePermission(admin, "Seul l'admin peut consulter les permissions.");
    requireArgument(!!data.userId, "L'ID utilisateur est requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      // Verify target user belongs to same school
      const targetSnap = await db.collection("users").doc(data.userId).get();
      if (targetSnap.exists && targetSnap.data()?.schoolId && targetSnap.data()?.schoolId !== schoolId) {
        throw new functions.https.HttpsError("permission-denied", "Cet utilisateur n'appartient pas a votre ecole.");
      }

      const permissions = await getUserPermissions(data.userId);
      const role = targetSnap.data()?.role || "";
      return { success: true, permissions, role };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des permissions.");
    }
  });

export const updateUserPermissions = functions
  .region("europe-west1")
  .https.onCall(async (data: { userId: string; permissions: string[] }, context) => {
    requireAuth(context.auth?.uid);
    const admin = await verifyAdmin(context.auth!.uid);
    requirePermission(admin, "Seul l'admin peut modifier les permissions.");
    requireArgument(!!data.userId, "L'ID utilisateur est requis.");
    requireArgument(Array.isArray(data.permissions), "Les permissions doivent etre un tableau.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      // Verify target user belongs to same school
      const targetSnap = await db.collection("users").doc(data.userId).get();
      if (targetSnap.exists && targetSnap.data()?.schoolId && targetSnap.data()?.schoolId !== schoolId) {
        throw new functions.https.HttpsError("permission-denied", "Cet utilisateur n'appartient pas a votre ecole.");
      }

      await db.collection("users").doc(data.userId).update({
        permissions: data.permissions,
      });
      return { success: true, message: "Permissions mises a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour des permissions.");
    }
  });
