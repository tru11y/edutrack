import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { requireAuth, requirePermission, handleError } from "../../helpers/errors";
import { getSchoolId, isSuperAdmin } from "../../helpers/tenant";
import { verifyAdmin } from "../../helpers/auth";

interface UpdateSchoolData {
  schoolId?: string; // superadmin can target any school
  schoolName?: string;
  schoolLogo?: string;
  primaryColor?: string;
  anneeScolaire?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

export const updateSchool = functions
  .region("europe-west1")
  .https.onCall(async (data: UpdateSchoolData, context) => {
    requireAuth(context.auth?.uid);

    const uid = context.auth!.uid;
    const superAdmin = await isSuperAdmin(uid);

    let schoolId: string;
    if (data.schoolId && superAdmin) {
      schoolId = data.schoolId;
    } else {
      const isAdmin = await verifyAdmin(uid);
      requirePermission(isAdmin || superAdmin, "Seuls les administrateurs peuvent modifier l'ecole.");
      schoolId = await getSchoolId(uid);
    }

    try {
      const updateData: Record<string, unknown> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (data.schoolName !== undefined) updateData.schoolName = data.schoolName;
      if (data.schoolLogo !== undefined) updateData.schoolLogo = data.schoolLogo;
      if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
      if (data.anneeScolaire !== undefined) updateData.anneeScolaire = data.anneeScolaire;
      if (data.adresse !== undefined) updateData.adresse = data.adresse;
      if (data.telephone !== undefined) updateData.telephone = data.telephone;
      if (data.email !== undefined) updateData.email = data.email;

      await db.collection("schools").doc(schoolId).update(updateData);

      return { success: true, message: "Ecole mise a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour de l'ecole.");
    }
  });
