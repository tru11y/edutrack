import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "europe-west1");
export const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

if (import.meta.env.DEV) {
  // @ts-expect-error Firebase debug token
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (appCheckSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Already initialized
  }
}

let authStateKnown = false;
let resolveAuthState: () => void;
const authStatePromise = new Promise<void>((resolve) => {
  resolveAuthState = resolve;
});

onAuthStateChanged(auth, () => {
  if (!authStateKnown) {
    authStateKnown = true;
    resolveAuthState();
  }
});

export async function ensureAuth(): Promise<string> {
  await authStatePromise;

  const user = auth.currentUser;
  if (!user) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const token = await user.getIdToken(true);
  return token;
}

export { app };
