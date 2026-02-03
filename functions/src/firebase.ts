import * as admin from "firebase-admin";

// Initialiser une seule fois
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export { admin };
