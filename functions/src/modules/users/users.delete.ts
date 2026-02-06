import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";

export const deleteUser = functions
  .region("europe-west1")
  .https.onCall(async (data: { userId: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent supprimer des utilisateurs.");
    requireArgument(!!data.userId, "ID utilisateur requis.");
    requireArgument(data.userId !== context.auth!.uid, "Vous ne pouvez pas supprimer votre propre compte.");

    try {
      const userDoc = await db.collection("users").doc(data.userId).get();
      const userData = userDoc.data();

      await admin.auth().deleteUser(data.userId);
      await db.collection("users").doc(data.userId).delete();

      await db.collection("audit_logs").add({
        action: "USER_DELETED",
        targetUserId: data.userId,
        targetEmail: userData?.email,
        targetRole: userData?.role,
        performedBy: context.auth!.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Utilisateur supprime." };
    } catch (error) {
      handleError(error, "Erreur lors de la suppression.");
    }
  });
