import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function notifyAdmins(
  schoolId: string | null,
  actorUid: string,
  actorName: string,
  message: string,
  type: string
): Promise<void> {
  try {
    const q = schoolId
      ? query(
          collection(db, "users"),
          where("schoolId", "==", schoolId),
          where("role", "in", ["admin", "gestionnaire"])
        )
      : query(collection(db, "users"), where("role", "in", ["admin", "gestionnaire"]));

    const snap = await getDocs(q);
    const writes: Promise<unknown>[] = [];

    for (const d of snap.docs) {
      if (d.id === actorUid) continue;
      const data = d.data();
      if (data.isActive === false) continue;

      writes.push(
        addDoc(collection(db, "notifications"), {
          recipientId: d.id,
          schoolId: schoolId || null,
          type,
          message,
          actorName,
          actorUid,
          status: "unread",
          createdAt: serverTimestamp(),
        })
      );
    }

    await Promise.all(writes);
  } catch (err) {
    // Notifications are non-critical — fail silently
    console.warn("notifyAdmins failed:", err);
  }
}
