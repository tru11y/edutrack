import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";

export const toggleUserStatus = functions
  .region("europe-west1")
  .https.onCall(async (data: { userId: string; isActive: boolean }, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent modifier le statut des utilisateurs.");
    requireArgument(!!data.userId && typeof data.isActive === "boolean", "Parametres invalides.");
    requireArgument(!(data.userId === context.auth!.uid && !data.isActive), "Vous ne pouvez pas desactiver votre propre compte.");

    try {
      await db.collection("users").doc(data.userId).update({
        isActive: data.isActive,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth!.uid,
      });

      await admin.auth().updateUser(data.userId, { disabled: !data.isActive });

      await db.collection("audit_logs").add({
        action: data.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        targetUserId: data.userId,
        performedBy: context.auth!.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: data.isActive ? "Utilisateur active." : "Utilisateur desactive." };
    } catch (error) {
      handleError(error, "Erreur lors de la modification du statut.");
    }
  });
