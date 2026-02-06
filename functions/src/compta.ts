import * as functions from "firebase-functions";
import { db, admin } from "./firebase";
import { verifyAdmin } from "./helpers.auth";

// ==================== DEPENSES ====================

interface CreateDepenseData {
  libelle: string;
  categorie: string;
  montant: number;
  date: string; // YYYY-MM-DD
}

export const createDepense = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateDepenseData, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent creer des depenses."
      );
    }

    if (!data.libelle || !data.categorie || !data.date) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Libelle, categorie et date sont requis."
      );
    }

    if (typeof data.montant !== "number" || data.montant <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Le montant doit etre un nombre positif."
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Format de date invalide (attendu: YYYY-MM-DD)."
      );
    }

    try {
      const ref = await db.collection("depenses").add({
        libelle: data.libelle,
        categorie: data.categorie,
        montant: data.montant,
        date: data.date,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
      });

      await db.collection("audit_logs").add({
        action: "DEPENSE_CREATED",
        depenseId: ref.id,
        montant: data.montant,
        performedBy: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Depense creee avec succes." };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la creation de la depense."
      );
    }
  });

interface GetDepensesData {
  mois?: string; // YYYY-MM
}

export const getDepenses = functions
  .region("europe-west1")
  .https.onCall(async (data: GetDepensesData, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent voir les depenses."
      );
    }

    try {
      const snap = await db.collection("depenses")
        .orderBy("date", "desc")
        .get();

      let docs = snap.docs;

      if (data?.mois) {
        docs = docs.filter((doc) => {
          const date = doc.data().date as string;
          return date && date.startsWith(data.mois!);
        });
      }

      const depenses = docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          libelle: d.libelle || "",
          categorie: d.categorie || "",
          montant: d.montant || 0,
          date: d.date || "",
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
          createdBy: d.createdBy || "",
        };
      });

      return { success: true, depenses };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la recuperation des depenses."
      );
    }
  });

export const deleteDepense = functions
  .region("europe-west1")
  .https.onCall(async (data: { depenseId: string }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent supprimer des depenses."
      );
    }

    if (!data.depenseId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID de la depense requis."
      );
    }

    try {
      const doc = await db.collection("depenses").doc(data.depenseId).get();
      if (!doc.exists) {
        throw new functions.https.HttpsError("not-found", "Depense non trouvee.");
      }

      await db.collection("depenses").doc(data.depenseId).delete();

      await db.collection("audit_logs").add({
        action: "DEPENSE_DELETED",
        depenseId: data.depenseId,
        performedBy: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: "Depense supprimee." };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la suppression de la depense."
      );
    }
  });

// ==================== SALAIRES ====================

interface CreateSalaireData {
  profId: string;
  mois: string; // YYYY-MM
  montant: number;
  statut: "paye" | "non_paye";
  datePaiement?: string; // YYYY-MM-DD
}

export const createSalaire = functions
  .region("europe-west1")
  .https.onCall(async (data: CreateSalaireData, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent creer des salaires."
      );
    }

    if (!data.profId || !data.mois) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Professeur et mois sont requis."
      );
    }

    if (typeof data.montant !== "number" || data.montant <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Le montant doit etre un nombre positif."
      );
    }

    const moisRegex = /^\d{4}-\d{2}$/;
    if (!moisRegex.test(data.mois)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Format de mois invalide (attendu: YYYY-MM)."
      );
    }

    if (!["paye", "non_paye"].includes(data.statut)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Statut invalide (paye ou non_paye)."
      );
    }

    if (data.datePaiement) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.datePaiement)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Format de date de paiement invalide (attendu: YYYY-MM-DD)."
        );
      }
    }

    // Verifier que le prof existe
    const profDoc = await db.collection("professeurs").doc(data.profId).get();
    if (!profDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Professeur non trouve.");
    }

    // Verifier doublon
    const existing = await db.collection("salaires")
      .where("profId", "==", data.profId)
      .where("mois", "==", data.mois)
      .get();

    if (!existing.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Un salaire existe deja pour ce professeur ce mois."
      );
    }

    const profData = profDoc.data();

    try {
      const salaireData: Record<string, unknown> = {
        profId: data.profId,
        profNom: `${profData?.prenom || ""} ${profData?.nom || ""}`.trim(),
        mois: data.mois,
        montant: data.montant,
        statut: data.statut,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
      };

      if (data.datePaiement) {
        salaireData.datePaiement = data.datePaiement;
      }

      const ref = await db.collection("salaires").add(salaireData);

      await db.collection("audit_logs").add({
        action: "SALAIRE_CREATED",
        salaireId: ref.id,
        profId: data.profId,
        montant: data.montant,
        performedBy: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Salaire cree avec succes." };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la creation du salaire."
      );
    }
  });

interface GetSalairesData {
  mois?: string; // YYYY-MM
}

export const getSalaires = functions
  .region("europe-west1")
  .https.onCall(async (data: GetSalairesData, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent voir les salaires."
      );
    }

    try {
      let query: FirebaseFirestore.Query = db.collection("salaires")
        .orderBy("mois", "desc");

      if (data?.mois) {
        query = db.collection("salaires")
          .where("mois", "==", data.mois)
          .orderBy("profNom", "asc");
      }

      const snap = await query.get();

      const salaires = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          profId: d.profId || "",
          profNom: d.profNom || "",
          mois: d.mois || "",
          montant: d.montant || 0,
          statut: d.statut || "non_paye",
          datePaiement: d.datePaiement || null,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        };
      });

      return { success: true, salaires };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la recuperation des salaires."
      );
    }
  });

export const updateSalaireStatut = functions
  .region("europe-west1")
  .https.onCall(async (data: { salaireId: string; statut: "paye" | "non_paye"; datePaiement?: string }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent modifier les salaires."
      );
    }

    if (!data.salaireId || !data.statut) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID du salaire et statut sont requis."
      );
    }

    try {
      const doc = await db.collection("salaires").doc(data.salaireId).get();
      if (!doc.exists) {
        throw new functions.https.HttpsError("not-found", "Salaire non trouve.");
      }

      const updateData: Record<string, unknown> = {
        statut: data.statut,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid,
      };

      if (data.statut === "paye" && data.datePaiement) {
        updateData.datePaiement = data.datePaiement;
      }

      await db.collection("salaires").doc(data.salaireId).update(updateData);

      return { success: true, message: "Statut du salaire mis a jour." };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la mise a jour du salaire."
      );
    }
  });

// ==================== STATS COMPTABILITE ====================

interface GetComptaStatsData {
  mois?: string; // YYYY-MM
}

export const getComptaStats = functions
  .region("europe-west1")
  .https.onCall(async (data: GetComptaStatsData, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Vous devez etre connecte."
      );
    }

    const isAdmin = await verifyAdmin(context.auth.uid);
    if (!isAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Seuls les administrateurs peuvent voir les statistiques comptables."
      );
    }

    try {
      const [paiementsSnap, depensesSnap, salairesSnap] = await Promise.all([
        db.collection("paiements").get(),
        db.collection("depenses").get(),
        db.collection("salaires").get(),
      ]);

      let totalPaiementsRecus = 0;
      let totalDepenses = 0;
      let totalSalaires = 0;

      if (data?.mois) {
        paiementsSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (d.mois === data.mois) {
            totalPaiementsRecus += d.montantPaye || 0;
          }
        });

        depensesSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (d.date && (d.date as string).startsWith(data.mois!)) {
            totalDepenses += d.montant || 0;
          }
        });

        salairesSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (d.mois === data.mois) {
            totalSalaires += d.montant || 0;
          }
        });
      } else {
        paiementsSnap.docs.forEach((doc) => {
          totalPaiementsRecus += doc.data().montantPaye || 0;
        });

        depensesSnap.docs.forEach((doc) => {
          totalDepenses += doc.data().montant || 0;
        });

        salairesSnap.docs.forEach((doc) => {
          totalSalaires += doc.data().montant || 0;
        });
      }

      const resultatNet = totalPaiementsRecus - (totalDepenses + totalSalaires);

      return {
        success: true,
        stats: {
          totalPaiementsRecus,
          totalDepenses,
          totalSalaires,
          resultatNet,
          mois: data?.mois || "all",
        },
      };
    } catch {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors du calcul des statistiques comptables."
      );
    }
  });
