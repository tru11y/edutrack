import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

/* =========================
   CONFIG ENV (VITE)
========================= */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* =========================
   INIT APP
========================= */

const app = initializeApp(firebaseConfig);

/* =========================
   APP CHECK - Protection anti-abus
========================= */

// Activer le mode debug en developpement (permet de tester sans reCAPTCHA)
if (import.meta.env.DEV) {
  // @ts-expect-error - Firebase debug token
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Initialiser App Check avec reCAPTCHA Enterprise
// La cle reCAPTCHA doit etre configuree dans la console Firebase
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (appCheckSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true, // Rafraichir automatiquement le token
    });
    console.info("App Check initialise avec succes");
  } catch {
    // App Check non configure - continuer sans protection
    console.warn("App Check non configure - protection anti-abus desactivee");
  }
} else if (!import.meta.env.DEV) {
  console.warn("VITE_RECAPTCHA_SITE_KEY manquant - App Check desactive");
}

/* =========================
   EXPORTS
========================= */

// 🔥 APP (pour Cloud Functions)
export { app };

// 🔐 AUTH
export const auth = getAuth(app);

// 🗄 FIRESTORE
export const db = getFirestore(app);
