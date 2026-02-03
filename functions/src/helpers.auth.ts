import { db } from "./firebase";

export async function verifyAdmin(uid: string): Promise<boolean> {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return false;
  const data = userDoc.data();
  return data?.role === "admin";
}

export async function verifyAdminOrGestionnaire(uid: string): Promise<boolean> {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return false;
  const data = userDoc.data();
  return data?.role === "admin" || data?.role === "gestionnaire";
}
