import * as functions from "firebase-functions";
import { db, admin } from "../../firebase";
import { verifyAdminOrGestionnaire } from "../../helpers/auth";
import { requireAuth, requirePermission, requireArgument, handleError, notFound } from "../../helpers/errors";
import { getSchoolId } from "../../helpers/tenant";

export const createBook = functions
  .region("europe-west1")
  .https.onCall(async (data: { titre: string; auteur: string; isbn?: string; quantite: number; categorie?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Acces refuse.");
    requireArgument(!!data.titre && !!data.auteur, "Titre et auteur requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = await db.collection("books").add({
        titre: data.titre,
        auteur: data.auteur,
        isbn: data.isbn || "",
        quantite: data.quantite || 1,
        disponible: data.quantite || 1,
        categorie: data.categorie || "",
        schoolId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: ref.id, message: "Livre ajoute avec succes." };
    } catch (error) {
      handleError(error, "Erreur lors de l'ajout du livre.");
    }
  });

export const updateBook = functions
  .region("europe-west1")
  .https.onCall(async (data: { id: string; titre?: string; auteur?: string; isbn?: string; quantite?: number; categorie?: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Acces refuse.");
    requireArgument(!!data.id, "ID du livre requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("books").doc(data.id);
      const snap = await ref.get();
      if (!snap.exists) notFound("Livre non trouve.");
      if (snap.data()?.schoolId !== schoolId) notFound("Livre non trouve.");

      const updates: Record<string, unknown> = {};
      if (data.titre !== undefined) updates.titre = data.titre;
      if (data.auteur !== undefined) updates.auteur = data.auteur;
      if (data.isbn !== undefined) updates.isbn = data.isbn;
      if (data.categorie !== undefined) updates.categorie = data.categorie;
      if (data.quantite !== undefined) {
        const currentBorrowed = (snap.data()?.quantite || 0) - (snap.data()?.disponible || 0);
        updates.quantite = data.quantite;
        updates.disponible = Math.max(0, data.quantite - currentBorrowed);
      }

      await ref.update(updates);
      return { success: true, message: "Livre mis a jour." };
    } catch (error) {
      handleError(error, "Erreur lors de la mise a jour du livre.");
    }
  });

export const deleteBook = functions
  .region("europe-west1")
  .https.onCall(async (data: { id: string }, context) => {
    requireAuth(context.auth?.uid);
    const isAllowed = await verifyAdminOrGestionnaire(context.auth!.uid);
    requirePermission(isAllowed, "Acces refuse.");
    requireArgument(!!data.id, "ID du livre requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const ref = db.collection("books").doc(data.id);
      const snap = await ref.get();
      if (!snap.exists) notFound("Livre non trouve.");
      if (snap.data()?.schoolId !== schoolId) notFound("Livre non trouve.");

      await ref.delete();
      return { success: true, message: "Livre supprime." };
    } catch (error) {
      handleError(error, "Erreur lors de la suppression du livre.");
    }
  });

export const listBooks = functions
  .region("europe-west1")
  .https.onCall(async (_data, context) => {
    requireAuth(context.auth?.uid);
    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const snap = await db.collection("books")
        .where("schoolId", "==", schoolId)
        .orderBy("titre")
        .get();

      const books = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return { success: true, books };
    } catch (error) {
      handleError(error, "Erreur lors de la recuperation des livres.");
    }
  });

export const borrowBook = functions
  .region("europe-west1")
  .https.onCall(async (data: { bookId: string; eleveId: string; eleveNom: string }, context) => {
    requireAuth(context.auth?.uid);
    requireArgument(!!data.bookId && !!data.eleveId, "ID livre et eleve requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const bookRef = db.collection("books").doc(data.bookId);
      const bookSnap = await bookRef.get();
      if (!bookSnap.exists) notFound("Livre non trouve.");
      if (bookSnap.data()?.schoolId !== schoolId) notFound("Livre non trouve.");

      const bookData = bookSnap.data()!;
      if ((bookData.disponible || 0) <= 0) {
        throw new functions.https.HttpsError("failed-precondition", "Aucun exemplaire disponible.");
      }

      const empruntRef = await db.collection("emprunts").add({
        bookId: data.bookId,
        bookTitre: bookData.titre,
        eleveId: data.eleveId,
        eleveNom: data.eleveNom,
        dateEmprunt: admin.firestore.FieldValue.serverTimestamp(),
        dateRetour: null,
        statut: "emprunte",
        schoolId,
      });

      await bookRef.update({
        disponible: admin.firestore.FieldValue.increment(-1),
      });

      return { success: true, id: empruntRef.id, message: "Emprunt enregistre." };
    } catch (error) {
      handleError(error, "Erreur lors de l'emprunt.");
    }
  });

export const returnBook = functions
  .region("europe-west1")
  .https.onCall(async (data: { empruntId: string }, context) => {
    requireAuth(context.auth?.uid);
    requireArgument(!!data.empruntId, "ID emprunt requis.");

    const schoolId = await getSchoolId(context.auth!.uid);

    try {
      const empruntRef = db.collection("emprunts").doc(data.empruntId);
      const empruntSnap = await empruntRef.get();
      if (!empruntSnap.exists) notFound("Emprunt non trouve.");
      if (empruntSnap.data()?.schoolId !== schoolId) notFound("Emprunt non trouve.");

      const empruntData = empruntSnap.data()!;
      if (empruntData.statut === "retourne") {
        throw new functions.https.HttpsError("failed-precondition", "Livre deja retourne.");
      }

      await empruntRef.update({
        dateRetour: admin.firestore.FieldValue.serverTimestamp(),
        statut: "retourne",
      });

      await db.collection("books").doc(empruntData.bookId).update({
        disponible: admin.firestore.FieldValue.increment(1),
      });

      return { success: true, message: "Retour enregistre." };
    } catch (error) {
      handleError(error, "Erreur lors du retour.");
    }
  });
