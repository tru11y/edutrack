import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";

/* =========================
   TYPES
========================= */

export type UserRole = "admin" | "prof" | "eleve" | "parent";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  eleveId?: string;
  professeurId?: string;
  enfantsIds?: string[];
  isBanned?: boolean;
}

/* =========================
   CONTEXT
========================= */

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/* =========================
   PROVIDER
========================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || !firebaseUser.email) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      // ✅ CAS 1 — PROFIL EXISTANT
      if (snap.exists()) {
        const data = snap.data();

        if (!data.isActive) {
          console.warn("⛔ Compte désactivé");
          setUser(null);
          setLoading(false);
          return;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: data.role,
          isActive: data.isActive,
          eleveId: data.eleveId,
          professeurId: data.professeurId,
          enfantsIds: data.enfantsIds,
        });

        setLoading(false);
        return;
      }

      // ✅ CAS 2 — PREMIÈRE CONNEXION → AUTO-CRÉATION
      console.warn(
        "⚠️ Profil Firestore absent → création automatique (admin)"
      );

      const newUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: "admin", // 👑 superviseur par défaut
        isActive: true,
      };

      await setDoc(userRef, {
        role: "admin",
        isActive: true,
        createdAt: serverTimestamp(),
      });

      setUser(newUser);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* =========================
     ACTIONS
  ========================= */

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   HOOK
========================= */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
