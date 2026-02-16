import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { getUserPermissions } from "../../helpers/permissions";

export const getUserPermissionsFunction = functions
  .region("europe-west1")
  .https.onCall(async (data: { userId: string }, context) => {
    requireAuth(context.auth?.uid);
    const admin = await verifyAdmin(context.auth!.uid);
    requirePermission(admin, "Seul l'admin peut consulter les permissions.");
    requireArgument(!!data.userId, "L'ID utilisateur est requis.");

    try {
      const permissions = await getUserPermissions(data.userId);
      const userSnap = await db.collection("users").doc(data.userId).get();
      const role = userSnap.data()?.role || "";
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

    try {
      await db.collection("users").doc(data.userId).update({
        permissions: data.permissions,
      });
      return { success: true, message: "Permissions mises a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour des permissions.");
    }
  });
