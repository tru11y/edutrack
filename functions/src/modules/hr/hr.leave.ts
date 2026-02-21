import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdmin, verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const createLeaveRequest = functions
  .region("europe-west1")
  .https.onCall(async (data: { type: string; dateDebut: string; dateFin: string; motif?: string }, context) => {
    requireAuth(context.auth?.uid);
    requireArgument(!!data.type && !!data.dateDebut && !!data.dateFin, "Type, date debut et date fin requis.");

    const schoolId = await getSchoolId(context.auth!.uid);
    const userDoc = await db.collection("users").doc(context.auth!.uid).get();
    const userData = userDoc.data();

    try {
      const ref = await db.collection("leave_requests").add({
        userId: context.auth!.uid,
        userName: `${userData?.prenom || ""} ${userData?.nom || ""}`.trim(),
        userRole: userData?.role || "",
        type: data.type,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        motif: data.motif || "",
        statut: "en_attente",
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Demande de conge soumise." };
    } catch (error) {
      handleError(error, "Erreur lors de la creation de la demande.");
    }
  });

export const listLeaveRequests = functions
  .region("europe-west1")
  .https.onCall(async (data: { all?: boolean }, context) => {
    requireAuth(context.auth?.uid);
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      let query: FirebaseFirestore.Query = db.collection("leave_requests")
        .where("schoolId", "==", schoolId)
        .orderBy("createdAt", "desc");

      // If not requesting all, only show own requests
      if (!data?.all) {
        query = query.where("userId", "==", context.auth!.uid);
      } else {
        const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
        requirePermission(isAllowed, "Acces refuse.");
      }

      const snap = await query.limit(200).get();
      const requests = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      }));

      return { success: true, requests };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des demandes.");
    }
  });

export const updateLeaveRequest = functions
  .region("europe-west1")
  .https.onCall(async (data: { id: string; statut: "approuve" | "refuse"; commentaire?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAdmin = await verifyAdmin(context.auth!.uid);
    requirePermission(isAdmin, "Seul l'administrateur peut approuver les conges.");
    requireArgument(!!data.id, "ID requis.");
    requireArgument(["approuve", "refuse"].includes(data.statut), "Statut invalide.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("leave_requests").doc(data.id);
      const snap = await ref.get();
      if (!snap.exists) notFound("Demande non trouvee.");
      if (snap.data()?.schoolId !== schoolId) notFound("Demande non trouvee.");

      await ref.update({
        statut: data.statut,
        commentaire: data.commentaire || "",
        reviewedBy: context.auth!.uid,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: `Demande ${data.statut === "approuve" ? "approuvee" : "refusee"}.` };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour de la demande.");
    }
  });
