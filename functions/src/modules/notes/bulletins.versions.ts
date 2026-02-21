import * as functions from "firebase-functions";
import { db } from "../../firebase";
import { verifyStaff } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const getBulletinVersions = functions
  .region("europe-west1")
  .https.onCall(async (data: { bulletinId: string }, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut consulter les versions.");
    requireArgument(!!data.bulletinId, "L'ID du bulletin est requis.");
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      // Verify bulletin belongs to this school
      const bulletinSnap = await db.collection("bulletins").doc(data.bulletinId).get();
      if (bulletinSnap.exists && bulletinSnap.data()?.schoolId && bulletinSnap.data()?.schoolId !== schoolId) {
        requirePermission(false, "Ce bulletin n'appartient pas a votre etablissement.");
      }

      const versionsSnap = await db
        .collection("bulletins")
        .doc(data.bulletinId)
        .collection("versions")
        .orderBy("versionNumber", "desc")
        .get();

      const versions = versionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      }));

      return { success: true, versions };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des versions.");
    }
  });

export const compareBulletinVersions = functions
  .region("europe-west1")
  .https.onCall(async (data: { bulletinId: string; versionA: string; versionB: string }, context) => {
    requireAuth(context.auth?.uid);
    const staff = await verifyStaff(context.auth!.uid);
    requirePermission(staff, "Seul le staff peut comparer les versions.");
    requireArgument(!!data.bulletinId, "L'ID du bulletin est requis.");
    requireArgument(!!data.versionA && !!data.versionB, "Les deux versions sont requises.");
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      // Verify bulletin belongs to this school
      const bulletinSnap = await db.collection("bulletins").doc(data.bulletinId).get();
      if (bulletinSnap.exists && bulletinSnap.data()?.schoolId && bulletinSnap.data()?.schoolId !== schoolId) {
        requirePermission(false, "Ce bulletin n'appartient pas a votre etablissement.");
      }
      const [vASnap, vBSnap] = await Promise.all([
        db.collection("bulletins").doc(data.bulletinId).collection("versions").doc(data.versionA).get(),
        db.collection("bulletins").doc(data.bulletinId).collection("versions").doc(data.versionB).get(),
      ]);

      if (!vASnap.exists || !vBSnap.exists) {
        return { success: false, message: "Version non trouvee." };
      }

      const vA = vASnap.data()!.data || {};
      const vB = vBSnap.data()!.data || {};

      const allMatieres = new Set([
        ...Object.keys(vA.moyennesMatiere || {}),
        ...Object.keys(vB.moyennesMatiere || {}),
      ]);

      const diff = Array.from(allMatieres).map((matiere) => {
        const noteA = vA.moyennesMatiere?.[matiere] ?? null;
        const noteB = vB.moyennesMatiere?.[matiere] ?? null;
        return {
          matiere,
          noteA,
          noteB,
          change: noteA !== null && noteB !== null ? Math.round((noteB - noteA) * 100) / 100 : null,
        };
      });

      return {
        success: true,
        diff,
        moyenneA: vA.moyenneGenerale ?? null,
        moyenneB: vB.moyenneGenerale ?? null,
      };
    } catch (error) {
      handleError(error, "Erreur lors de la comparaison des versions.");
    }
  });
