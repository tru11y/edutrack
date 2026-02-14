import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { moveCahierToTrash } from "../modules/cahier/cahier.service";
import { getAllCahierEntriesSecure, type CahierEntryAdmin } from "../services/cloudFunctions";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { CahierEntry } from "../modules/cahier/cahier.types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

type CahierDisplay = CahierEntry & { id: string };

export default function CahierList() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const isAdmin = user?.role === "admin";
  const isGestionnaire = user?.role === "gestionnaire";
  const isProf = user?.role === "prof";
  const [cahiers, setCahiers] = useState<CahierDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClasse, setFilterClasse] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Verifier si une entree est modifiable (moins de 24h)
  const isWithin24h = (cahier: CahierDisplay): boolean => {
    if (!cahier.createdAt) return true;
    const createdTime = cahier.createdAt.toDate().getTime();
    const now = Date.now();
    const hours24 = 24 * 60 * 60 * 1000;
    return now - createdTime < hours24;
  };

  // Verifier si l'utilisateur peut modifier une entree
  const canEdit = (cahier: CahierDisplay): boolean => {
    if (cahier.isSigned) return false;
    if (isAdmin) return true;
    if (isGestionnaire) return true;
    if (isProf && cahier.profId === user?.uid) {
      return isWithin24h(cahier);
    }
    return false;
  };

  // Verifier si l'utilisateur peut supprimer une entree
  const canDelete = (cahier: CahierDisplay): boolean => {
    if (cahier.isSigned) return false;
    if (isAdmin) return true;
    if (isGestionnaire) {
      return cahier.profId === user?.uid;
    }
    if (isProf && cahier.profId === user?.uid) {
      return isWithin24h(cahier);
    }
    return false;
  };

  const loadCahiers = async () => {
    try {
      let data: CahierDisplay[] = [];

      if (isAdmin) {
        // ADMIN: Utiliser Cloud Function UNIQUEMENT
        const result = await getAllCahierEntriesSecure();
        data = result.entries.map((entry: CahierEntryAdmin) => ({
          id: entry.id,
          coursId: entry.coursId,
          classe: entry.classe,
          profId: entry.profId,
          profNom: entry.profNom,
          date: entry.date,
          eleves: entry.eleves,
          contenu: entry.contenu,
          devoirs: entry.devoirs,
          isSigned: entry.isSigned,
          signedAt: entry.signedAt ? { toDate: () => new Date(entry.signedAt!) } : undefined,
          createdAt: entry.createdAt ? { toDate: () => new Date(entry.createdAt!) } : undefined,
        } as CahierDisplay));
      } else if (isGestionnaire) {
        // GESTIONNAIRE: Lecture Firestore directe
        const cahierRef = collection(db, "cahier");
        const snap = await getDocs(cahierRef);
        data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as CahierEntry),
        }));
      } else if (isProf && user?.uid) {
        // PROF: Seulement ses propres entrees via Firestore
        const cahierRef = collection(db, "cahier");
        const q = query(cahierRef, where("profId", "==", user.uid));
        const snap = await getDocs(q);
        data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as CahierEntry),
        }));
      }

      setCahiers(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCahiers();
  }, [user?.uid, isProf, isAdmin, isGestionnaire]);

  const handleDelete = async (cahier: CahierDisplay) => {
    if (!cahier.id) return;
    if (!canDelete(cahier)) {
      alert("Vous n'avez pas la permission de supprimer cette entree.");
      return;
    }
    if (!window.confirm(`Supprimer cette entree du ${new Date(cahier.date).toLocaleDateString("fr-FR")} pour ${cahier.classe} ?\n\nElle sera deplacee dans la corbeille.`)) return;

    try {
      await moveCahierToTrash(cahier.id);
      await loadCahiers();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const classes = [...new Set(cahiers.map((c) => c.classe).filter(Boolean))];
  const filtered = cahiers.filter((c) => {
    const matchSearch = !search ||
      c.classe?.toLowerCase().includes(search.toLowerCase()) ||
      c.contenu?.toLowerCase().includes(search.toLowerCase()) ||
      c.profNom?.toLowerCase().includes(search.toLowerCase());
    const matchClasse = !filterClasse || c.classe === filterClasse;
    const matchDate = !filterDate || c.date === filterDate;
    return matchSearch && matchClasse && matchDate;
  });

  if (loading) {
    return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}><div style={{ textAlign: "center" }}><div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} /><p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p></div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 19.5V4.5C4 3.67 4.67 3 5.5 3H18.5C19.33 3 20 3.67 20 4.5V19.5C20 20.33 19.33 21 18.5 21H5.5C4.67 21 4 20.33 4 19.5Z" stroke="currentColor" strokeWidth="2"/><path d="M12 3V21M4 9H20" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Cahier de texte</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
                {isProf ? "Mes entrees" : `${cahiers.length} entree${cahiers.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {isAdmin && (
              <Link to="/corbeille" style={{ padding: "12px 20px", background: colors.bgSecondary, color: colors.textMuted, borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2.25 4.5H15.75M6.75 4.5V3C6.75 2.17 7.42 1.5 8.25 1.5H9.75C10.58 1.5 11.25 2.17 11.25 3V4.5M7.5 8.25V12.75M10.5 8.25V12.75M3.75 4.5L4.5 15C4.5 15.83 5.17 16.5 6 16.5H12C12.83 16.5 13.5 15.83 13.5 15L14.25 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Corbeille
              </Link>
            )}
            <Link to="/cahier/nouveau" style={{ padding: "12px 20px", background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`, color: colors.onGradient, borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Remplir cahier de texte
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "12px 16px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, outline: "none", background: colors.bgInput, color: colors.text }}
        />
        <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} aria-label="Filtrer par classe" style={{ padding: "12px 16px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgInput, color: colors.text, minWidth: 160 }}>
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          aria-label="Filtrer par date"
          style={{ padding: "12px 16px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, background: colors.bgInput, color: colors.text }}
        />
        {(search || filterClasse || filterDate) && (
          <button
            onClick={() => { setSearch(""); setFilterClasse(""); setFilterDate(""); }}
            style={{ padding: "12px 16px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer" }}
          >
            Effacer
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{cahiers.length === 0 ? "Aucune entree" : "Aucune entree trouvee"}</p>
          <Link to="/cahier/nouveau" style={{ display: "inline-block", marginTop: 16, padding: "10px 20px", background: colors.primaryBg, color: colors.primary, borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Creer une entree</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((cahier) => {
            const editAllowed = canEdit(cahier);
            const deleteAllowed = canDelete(cahier);
            const timeExpired = isProf && cahier.profId === user?.uid && !isWithin24h(cahier);

            return (
              <div key={cahier.id} style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", background: colors.bgSecondary, borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontSize: 12, fontWeight: 600, flexDirection: "column" }}>
                      <span>{new Date(cahier.date).getDate()}</span><span style={{ fontSize: 10 }}>{new Date(cahier.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: colors.text }}>{cahier.classe}</p>
                      <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>{new Date(cahier.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}{cahier.profNom && ` - ${cahier.profNom}`}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {cahier.isSigned && <span style={{ padding: "4px 10px", background: colors.successBg, color: colors.success, borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Signe</span>}
                    {timeExpired && !cahier.isSigned && (
                      <span style={{ padding: "4px 10px", background: colors.warningBg, color: colors.warning, borderRadius: 6, fontSize: 12, fontWeight: 500 }}>Delai expire</span>
                    )}
                    {editAllowed && (
                      <Link
                        to={`/cahier/${cahier.id}/modifier`}
                        style={{
                          padding: "6px 12px",
                          background: colors.infoBg,
                          color: colors.info,
                          borderRadius: 6,
                          textDecoration: "none",
                          fontSize: 12,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M10.08 1.75L12.25 3.92M1.75 12.25L2.33 9.92L10.5 1.75L12.25 3.5L4.08 11.67L1.75 12.25Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Modifier
                      </Link>
                    )}
                    {deleteAllowed && (
                      <button
                        onClick={() => handleDelete(cahier)}
                        style={{
                          padding: "6px 12px",
                          background: colors.dangerBg,
                          color: colors.danger,
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1.75 3.5H12.25M5.25 3.5V2.33C5.25 1.69 5.77 1.17 6.42 1.17H7.58C8.23 1.17 8.75 1.69 8.75 2.33V3.5M5.83 6.42V10.08M8.17 6.42V10.08M2.92 3.5L3.5 11.67C3.5 12.31 4.02 12.83 4.67 12.83H9.33C9.98 12.83 10.5 12.31 10.5 11.67L11.08 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  {cahier.contenu && <div style={{ marginBottom: 16 }}><p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 6px", textTransform: "uppercase", fontWeight: 600 }}>Contenu</p><p style={{ fontSize: 14, color: colors.text, margin: 0, lineHeight: 1.6 }}>{cahier.contenu}</p></div>}
                  {cahier.devoirs && <div style={{ padding: 16, background: colors.warningBg, borderRadius: 10, border: `1px solid ${colors.warning}40` }}><p style={{ fontSize: 12, color: colors.warning, margin: "0 0 6px", textTransform: "uppercase", fontWeight: 600 }}>Devoirs</p><p style={{ fontSize: 14, color: colors.text, margin: 0, lineHeight: 1.6 }}>{cahier.devoirs}</p></div>}
                  {!cahier.contenu && !cahier.devoirs && <p style={{ fontSize: 14, color: colors.textMuted, margin: 0, fontStyle: "italic" }}>Aucun contenu</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
