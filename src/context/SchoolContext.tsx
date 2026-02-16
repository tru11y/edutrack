import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

export interface SchoolConfig {
  schoolName: string;
  schoolLogo: string;
  primaryColor: string;
  anneeScolaire: string;
  adresse: string;
  telephone: string;
  email: string;
}

const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: "EduTrack",
  schoolLogo: "",
  primaryColor: "#6366f1",
  anneeScolaire: "2025-2026",
  adresse: "",
  telephone: "",
  email: "",
};

interface SchoolContextType {
  school: SchoolConfig;
  loading: boolean;
}

const SchoolContext = createContext<SchoolContextType>({ school: DEFAULT_CONFIG, loading: true });

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [school, setSchool] = useState<SchoolConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "config", "school"),
      (snap) => {
        if (snap.exists()) {
          setSchool({ ...DEFAULT_CONFIG, ...snap.data() } as SchoolConfig);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return (
    <SchoolContext.Provider value={{ school, loading }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  return useContext(SchoolContext);
}
