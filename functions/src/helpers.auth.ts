import { db } from "./firebase";

export async function verifyAdmin(uid: string): Promise<boolean> {
  ...
}

export async function verifyAdminOrGestionnaire(uid: string): Promise<boolean> {
  ...
}
