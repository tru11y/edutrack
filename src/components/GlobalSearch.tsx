import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

interface SearchResult {
  id: string;
  type: "eleve" | "evaluation" | "paiement" | "user";
  label: string;
  sub: string;
  link: string;
}

const TYPE_ICONS: Record<string, string> = {
  eleve: "E",
  evaluation: "N",
  paiement: "P",
  user: "U",
};

const TYPE_COLORS: Record<string, string> = {
  eleve: "#3b82f6",
  evaluation: "#8b5cf6",
  paiement: "#10b981",
  user: "#f59e0b",
};

export default function GlobalSearch() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin" || user?.role === "gestionnaire";

  // Load data once on first open
  useEffect(() => {
    if (!open || loaded) return;

    const loadAll = async () => {
      const items: SearchResult[] = [];

      try {
        // Eleves
        if (isAdmin) {
          const elevesSnap = await getDocs(query(collection(db, "eleves"), limit(500)));
          elevesSnap.docs.forEach((doc) => {
            const d = doc.data();
            items.push({
              id: doc.id,
              type: "eleve",
              label: `${d.prenom || ""} ${d.nom || ""}`.trim(),
              sub: d.classe || "",
              link: `/eleves/${doc.id}`,
            });
          });

          // Users
          const usersSnap = await getDocs(query(collection(db, "users"), limit(200)));
          usersSnap.docs.forEach((doc) => {
            const d = doc.data();
            items.push({
              id: doc.id,
              type: "user",
              label: d.prenom && d.nom ? `${d.prenom} ${d.nom}` : d.email?.split("@")[0] || "",
              sub: d.role || "",
              link: `/utilisateurs`,
            });
          });
        }

        setAllData(items);
        setLoaded(true);
      } catch {
        // silently fail
      }
    };
    loadAll();
  }, [open, loaded, isAdmin]);

  // Filter results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = allData.filter(
      (r) => r.label.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)
    );
    setResults(filtered.slice(0, 15));
  }, [searchQuery, allData]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (r: SearchResult) => {
    navigate(r.link);
    setOpen(false);
    setSearchQuery("");
  };

  if (!isAdmin) return null;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Search trigger */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
          background: colors.bgHover, border: `1px solid ${colors.border}`, borderRadius: 8,
          color: colors.textMuted, cursor: "pointer", fontSize: 13, minWidth: 200,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M7 12C9.76 12 12 9.76 12 7C12 4.24 9.76 2 7 2C4.24 2 2 4.24 2 7C2 9.76 4.24 12 7 12ZM14 14L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Rechercher...
        <span style={{ marginLeft: "auto", fontSize: 11, padding: "2px 6px", background: colors.bg, borderRadius: 4, border: `1px solid ${colors.border}` }}>Ctrl+K</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 999,
          display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 100,
        }}>
          <div style={{
            background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`,
            width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}` }}>
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un eleve, utilisateur..."
                style={{
                  width: "100%", padding: "12px 0", background: "transparent",
                  border: "none", color: colors.text, fontSize: 16, outline: "none",
                }}
              />
            </div>
            <div style={{ maxHeight: 350, overflowY: "auto", padding: 8 }}>
              {searchQuery && results.length === 0 && (
                <p style={{ padding: 20, textAlign: "center", color: colors.textMuted, fontSize: 14 }}>Aucun resultat</p>
              )}
              {!searchQuery && (
                <p style={{ padding: 20, textAlign: "center", color: colors.textMuted, fontSize: 14 }}>Tapez pour rechercher...</p>
              )}
              {results.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleSelect(r)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "10px 12px", background: "transparent", border: "none",
                    borderRadius: 8, cursor: "pointer", textAlign: "left", color: colors.text,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${TYPE_COLORS[r.type]}20`, color: TYPE_COLORS[r.type],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {TYPE_ICONS[r.type]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{r.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>{r.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ padding: "8px 16px", borderTop: `1px solid ${colors.border}`, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 12 }}>
                Echap pour fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
