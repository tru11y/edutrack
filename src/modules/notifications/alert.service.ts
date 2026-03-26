import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { logger } from "../../utils/logger";

interface AdminAlert {
  type: "ban" | "paiement" | "presence" | "info";
  eleveId?: string;
  message: string;
  schoolId?: string;
}

export async function notifyAdmin(alert: AdminAlert): Promise<void> {
  try {
    await addDoc(collection(db, "admin_alerts"), {
      ...alert,
      createdAt: serverTimestamp(),
      read: false,
    });
  } catch (err) {
    logger.error("notifyAdmin failed:", err);
  }
}
