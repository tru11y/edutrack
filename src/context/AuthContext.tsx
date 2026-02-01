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
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";

/* =========================
   TYPES
========================= */

export type UserRole = "admin" | "gestionnaire" | "prof" | "eleve" | "parent";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  eleveId?: string;
  professeurId?: string;
  enfantsIds?: string[];
  isBanned?: boolean;
  nom?: string;
  prenom?: string;
}

export interface OnlineUser {
  id: string;
  email: string;
  role: UserRole;
  nom?: string;
  prenom?: string;
  lastSeen: Date;
  isOnline: boolean;
}

export interface ConnectionLog {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userRole: UserRole;
  loginAt: Date;
  logoutAt?: Date;
  device: string;
  browser: string;
  location?: string;
  ip?: string;
}

/* =========================
   CONTEXT
========================= */

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  onlineUsers: OnlineUser[];
  connectionLogs: ConnectionLog[];
}

const AuthContext = createContext<AuthContextType | null>(null);

/* =========================
   HELPERS
========================= */

// Detecter les infos du navigateur et appareil
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = "Desktop";
  let browser = "Inconnu";

  // Detecter appareil
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    if (/iPad/i.test(ua)) device = "Tablette";
    else device = "Mobile";
  }

  // Detecter navigateur
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("Opera")) browser = "Opera";

  return { device, browser };
}

// Obtenir la localisation approximative via IP (gratuit)
async function getLocationInfo(): Promise<{ location: string; ip: string }> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    return {
      location: `${data.city || ""}, ${data.country_name || ""}`.trim().replace(/^,\s*/, ""),
      ip: data.ip || "",
    };
  } catch {
    return { location: "Inconnu", ip: "" };
  }
}

// Migrer admin2 vers gestionnaire
function migrateRole(role: string): UserRole {
  if (role === "admin2") return "gestionnaire";
  return role as UserRole;
}

/* =========================
   PROVIDER
========================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Ecouter les utilisateurs en ligne
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "gestionnaire")) return;

    // Ecouter TOUS les utilisateurs actifs
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const users: OnlineUser[] = snap.docs
        .filter((d) => d.data().isActive !== false)
        .map((d) => {
          const data = d.data();
          const lastSeen = data.lastSeen?.toDate?.() || new Date(0);
          // Considere en ligne si actif dans les 3 dernieres minutes
          const isOnline = Date.now() - lastSeen.getTime() < 3 * 60 * 1000;
          return {
            id: d.id,
            email: data.email || "",
            role: migrateRole(data.role),
            nom: data.nom,
            prenom: data.prenom,
            lastSeen,
            isOnline,
          };
        });
      setOnlineUsers(users);
    });

    return () => unsub();
  }, [user?.uid, user?.role]);

  // Ecouter les logs de connexion
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "gestionnaire")) return;

    const unsub = onSnapshot(
      query(collection(db, "connection_logs")),
      (snap) => {
        const logs: ConnectionLog[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              userId: data.userId,
              userEmail: data.userEmail,
              userName: data.userName,
              userRole: migrateRole(data.userRole),
              loginAt: data.loginAt?.toDate?.() || new Date(),
              logoutAt: data.logoutAt?.toDate?.(),
              device: data.device,
              browser: data.browser,
              location: data.location,
              ip: data.ip,
            };
          })
          .sort((a, b) => b.loginAt.getTime() - a.loginAt.getTime())
          .slice(0, 100); // Garder les 100 derniers
        setConnectionLogs(logs);
      }
    );

    return () => unsub();
  }, [user?.uid, user?.role]);

  // Mettre a jour le statut en ligne periodiquement
  useEffect(() => {
    if (!user?.uid) return;

    const updateOnlineStatus = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        // Utiliser setDoc avec merge pour creer le champ s'il n'existe pas
        await setDoc(userRef, { lastSeen: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Erreur mise a jour statut:", err);
      }
    };

    // Mettre a jour immediatement puis toutes les minutes
    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 60 * 1000); // Chaque minute

    return () => clearInterval(interval);
  }, [user?.uid]);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || !firebaseUser.email) {
        // Deconnexion - mettre a jour le log
        if (currentSessionId) {
          try {
            const logRef = doc(db, "connection_logs", currentSessionId);
            await updateDoc(logRef, { logoutAt: serverTimestamp() });
          } catch (err) {
            console.error("Erreur log deconnexion:", err);
          }
        }
        setUser(null);
        setCurrentSessionId(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();

        if (!data.isActive) {
          console.warn("Compte desactive");
          setUser(null);
          setLoading(false);
          return;
        }

        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: migrateRole(data.role),
          isActive: data.isActive,
          eleveId: data.eleveId,
          professeurId: data.professeurId,
          enfantsIds: data.enfantsIds,
          nom: data.nom,
          prenom: data.prenom,
        };

        setUser(appUser);

        // Creer un log de connexion
        if (!currentSessionId) {
          try {
            const { device, browser } = getDeviceInfo();
            const { location, ip } = await getLocationInfo();

            const logDoc = await addDoc(collection(db, "connection_logs"), {
              userId: firebaseUser.uid,
              userEmail: firebaseUser.email,
              userName: data.prenom && data.nom ? `${data.prenom} ${data.nom}` : firebaseUser.email?.split("@")[0],
              userRole: appUser.role,
              loginAt: serverTimestamp(),
              device,
              browser,
              location,
              ip,
            });
            setCurrentSessionId(logDoc.id);

            // Mettre a jour lastSeen
            await updateDoc(userRef, { lastSeen: serverTimestamp() });
          } catch (err) {
            console.error("Erreur creation log:", err);
          }
        }

        setLoading(false);
        return;
      }

      // Premiere connexion - auto-creation admin
      console.warn("Profil Firestore absent - creation automatique (admin)");

      const newUser: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: "admin",
        isActive: true,
      };

      await setDoc(userRef, {
        role: "admin",
        isActive: true,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });

      setUser(newUser);
      setLoading(false);
    });

    return () => unsub();
  }, [currentSessionId]);

  /* =========================
     ACTIONS
  ========================= */

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    // Mettre a jour le log avant deconnexion
    if (currentSessionId) {
      try {
        const logRef = doc(db, "connection_logs", currentSessionId);
        await updateDoc(logRef, { logoutAt: serverTimestamp() });
      } catch (err) {
        console.error("Erreur log deconnexion:", err);
      }
    }
    await signOut(auth);
    setUser(null);
    setCurrentSessionId(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, onlineUsers, connectionLogs }}>
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
