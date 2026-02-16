import { getMessaging, getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { doc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { app, db, auth } from "./firebase";

let messaging: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

export async function requestPushPermission(): Promise<boolean> {
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch {
    return false;
  }
}

export async function saveFCMToken(): Promise<string | null> {
  try {
    const m = getMessagingInstance();
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) return null;

    const token = await getToken(m, { vapidKey });
    const userId = auth.currentUser?.uid;
    if (token && userId) {
      await setDoc(
        doc(db, "users", userId),
        { fcmTokens: arrayUnion(token) },
        { merge: true }
      );
    }
    return token;
  } catch {
    return null;
  }
}

export async function removeFCMToken(): Promise<void> {
  try {
    const m = getMessagingInstance();
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) return;

    const token = await getToken(m, { vapidKey });
    const userId = auth.currentUser?.uid;
    if (token && userId) {
      await setDoc(
        doc(db, "users", userId),
        { fcmTokens: arrayRemove(token) },
        { merge: true }
      );
    }
  } catch {
    // silent
  }
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  try {
    const m = getMessagingInstance();
    return onMessage(m, callback);
  } catch {
    return () => {};
  }
}
