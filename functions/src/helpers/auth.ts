import { db } from "../firebase";

export async function verifyAdmin(uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists && snap.data()?.role === "admin";
}

export async function verifyAdminOrGestionnaire(uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return false;
  const role = snap.data()?.role;
  return role === "admin" || role === "gestionnaire";
}

export async function verifyProf(uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists && snap.data()?.role === "prof";
}

export async function verifyStaff(uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return false;
  const role = snap.data()?.role;
  return role === "admin" || role === "gestionnaire" || role === "prof";
}

export async function verifyProfOrAdmin(uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return false;
  const role = snap.data()?.role;
  return role === "admin" || role === "prof";
}

export { verifyHasPermission } from "./permissions";
