import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdmin } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { isValidEmail, VALID_ROLES } from "../../helpers/validation";

interface CreateUserData {
  email: string;
  password: string;
  role: "admin" | "gestionnaire" | "prof" | "eleve" | "parent";
  nom?: string;
  prenom?: string;
  eleveId?: string;
  professeurId?: string;
  enfantsIds?: string[];
}

export const createUser = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateUserData, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seuls les administrateurs peuvent creer des utilisateurs.");

    requireArgument(!!data.email && !!data.password && !!data.role, "Email, mot de passe et role sont requis.");
    requireArgument(isValidEmail(data.email), "Format d'email invalide.");
    requireArgument(data.password.length >= 6, "Le mot de passe doit contenir au moins 6 caracteres.");
    requireArgument(VALID_ROLES.includes(data.role), "Role invalide.");

    try {
      const userRecord = await admin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.prenom && data.nom ? `${data.prenom} ${data.nom}` : undefined,
      });

      await db.collection("users").doc(userRecord.uid).set({
        email: data.email,
        role: data.role,
        isActive: true,
        nom: data.nom || null,
        prenom: data.prenom || null,
        eleveId: data.eleveId || null,
        professeurId: data.professeurId || null,
        enfantsIds: data.enfantsIds || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth!.uid,
      });

      await db.collection("audit_logs").add({
        action: "USER_CREATED",
        targetUserId: userRecord.uid,
        targetEmail: data.email,
        targetRole: data.role,
        performedBy: context.auth!.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, uid: userRecord.uid, message: "Utilisateur cree avec succes." };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === "auth/email-already-exists") {
        throw new functions.https.HttpsError("already-exists", "Cet email est deja utilise.");
      }
      handleError(error, "Erreur lors de la creation de l'utilisateur.");
    }
  });
