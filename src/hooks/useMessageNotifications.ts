import { useEffect, useRef, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

export interface NotificationMessage {
  id: string;
  auteurId: string;
  auteurNom: string;
  auteurRole?: string;
  contenu: string;
  destinataire: string;
  createdAt?: Timestamp;
}

export function useMessageNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const mountTimeRef = useRef<Date>(new Date());
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.uid) return;

    mountTimeRef.current = new Date();
    seenIdsRef.current.clear();

    const isAdminOrGest = user.role === "admin" || user.role === "gestionnaire";
    const isProf = user.role === "prof";

    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(5));

    const unsub = onSnapshot(q, (snap) => {
      const newMessages: NotificationMessage[] = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data() as Omit<NotificationMessage, "id">;
        const msg: NotificationMessage = { id: docSnap.id, ...data };

        // Skip own messages
        if (msg.auteurId === user.uid) continue;

        // Skip already seen
        if (seenIdsRef.current.has(msg.id)) continue;

        // Skip messages from before mount
        if (!msg.createdAt) continue;
        const msgDate = msg.createdAt.toDate();
        if (msgDate <= mountTimeRef.current) {
          seenIdsRef.current.add(msg.id);
          continue;
        }

        // Role-based filtering
        const dest = msg.destinataire;
        const canSee =
          dest === "tous" ||
          dest === user.uid ||
          (dest === "admins" && isAdminOrGest) ||
          (dest === "profs" && isProf);

        if (!canSee) continue;

        seenIdsRef.current.add(msg.id);
        newMessages.push(msg);
      }

      if (newMessages.length > 0) {
        setNotifications((prev) => [...newMessages, ...prev].slice(0, 5));
      }
    });

    return () => unsub();
  }, [user?.uid, user?.role]);

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const dismissAll = () => setNotifications([]);

  return { notifications, dismiss, dismissAll };
}
