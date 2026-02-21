import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { requireArgument, handleError } from "../../helpers/errors";
import { isValidEmail } from "../../helpers/validation";

interface CreateSchoolData {
  schoolName: string;
  adminEmail: string;
  adminPassword: string;
  adminNom?: string;
  adminPrenom?: string;
  adresse?: string;
  telephone?: string;
  anneeScolaire?: string;
}

/**
 * Public endpoint: creates a new school + its admin user + default subscription.
 * No auth required (used for signup flow).
 */
export const createSchool = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateSchoolData) => {
    requireArgument(!!data.schoolName, "Le nom de l'ecole est requis.");
    requireArgument(!!data.adminEmail && !!data.adminPassword, "Email et mot de passe admin requis.");
    requireArgument(isValidEmail(data.adminEmail), "Format d'email invalide.");
    requireArgument(data.adminPassword.length >= 6, "Le mot de passe doit contenir au moins 6 caracteres.");

    try {
      // 1. Create the school document
      const schoolRef = db.collection("schools").doc();
      const schoolId = schoolRef.id;

      await schoolRef.set({
        schoolName: data.schoolName,
        schoolLogo: "",
        primaryColor: "#6366f1",
        anneeScolaire: data.anneeScolaire || "2025-2026",
        adresse: data.adresse || "",
        telephone: data.telephone || "",
        email: data.adminEmail,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        plan: "free",
        isActive: true,
      });

      // 2. Create the admin user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: data.adminEmail,
        password: data.adminPassword,
        displayName: data.adminPrenom && data.adminNom
          ? `${data.adminPrenom} ${data.adminNom}`
          : undefined,
      });

      // 3. Create the user profile in Firestore
      await db.collection("users").doc(userRecord.uid).set({
        email: data.adminEmail,
        role: "admin",
        isActive: true,
        nom: data.adminNom || null,
        prenom: data.adminPrenom || null,
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Create default subscription
      await db.collection("school_subscriptions").doc(schoolId).set({
        schoolId,
        plan: "free",
        maxEleves: 50,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Create default config for the school (backward compat)
      await db.collection("schools").doc(schoolId).collection("config").doc("school").set({
        schoolName: data.schoolName,
        schoolLogo: "",
        primaryColor: "#6366f1",
        anneeScolaire: data.anneeScolaire || "2025-2026",
        adresse: data.adresse || "",
        telephone: data.telephone || "",
        email: data.adminEmail,
      });

      return {
        success: true,
        schoolId,
        uid: userRecord.uid,
        message: "Ecole creee avec succes.",
      };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === "auth/email-already-exists") {
        throw new functions.https.HttpsError("already-exists", "Cet email est deja utilise.");
      }
      handleError(error, "Erreur lors de la creation de l'ecole.");
    }
  });
