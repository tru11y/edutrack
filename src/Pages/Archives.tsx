import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast, ConfirmModal } from "../components/ui";
import { archiveAnneeScolaireSecure, getCloudFunctionErrorMessage } from "../services/cloudFunctions";

const ARCHIVE_COLLECTIONS = ["eleves", "notes", "bulletins", "presences", "paiements"];

export default function Archives() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("eleves");
  const [archiveData, setArchiveData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [newArchiveYear, setNewArchiveYear] = useState("");
  const [deleteOriginals, setDeleteOriginals] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Detect available archive years
  useEffect(() => {
    const detectYears = async () => {
      try {
        // Try common patterns
        const years: Set<string> = new Set();
        for (const year of ["2023-2024", "2024-2025", "2025-2026"]) {
          const snap = await getDocs(collection(db, `archives/${year}/eleves`));
          if (!snap.empty) years.add(year);
        }
        setAvailableYears(Array.from(years).sort());
      } catch { /* ignore */ }
    };
    detectYears();
  }, []);

  const loadArchive = async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, `archives/${selectedYear}/${selectedCollection}`));
      setArchiveData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      toast.error("Erreur lors du chargement des archives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedYear) loadArchive();
  }, [selectedYear, selectedCollection]);

  const handleArchive = async () => {
    setConfirmOpen(false);
    setArchiving(true);
    try {
      const result = await archiveAnneeScolaireSecure({ anneeScolaire: newArchiveYear, deleteOriginals });
      if (result.success) {
        toast.success(result.message);
        setAvailableYears((prev) => [...new Set([...prev, newArchiveYear])].sort());
        setNewArchiveYear("");
      }
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setArchiving(false);
    }
  };

  const inputStyle = {
    padding: "10px 14px", border: `1px solid ${colors.border}`,
    borderRadius: 8, fontSize: 14, background: colors.bgCard, color: colors.text,
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>
          {t("archives")}
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
          Consultez les donnees archivees par annee scolaire
        </p>
      </div>

      {/* Archive action */}
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>
          {t("archiveYear")}
        </h2>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Annee scolaire</label>
            <input type="text" value={newArchiveYear} onChange={(e) => setNewArchiveYear(e.target.value)} placeholder="2024-2025" style={inputStyle} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={deleteOriginals} onChange={(e) => setDeleteOriginals(e.target.checked)} />
            Supprimer les originaux
          </label>
          <button
            onClick={() => newArchiveYear ? setConfirmOpen(true) : null}
            disabled={!newArchiveYear || archiving}
            style={{
              padding: "10px 20px", background: colors.warning, color: "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: !newArchiveYear ? "not-allowed" : "pointer",
              opacity: !newArchiveYear ? 0.5 : 1,
            }}
          >
            {archiving ? "Archivage..." : "Archiver"}
          </button>
        </div>
      </div>

      {/* Browse archives */}
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={inputStyle}>
            <option value="">Choisir une annee</option>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)} style={inputStyle}>
            {ARCHIVE_COLLECTIONS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>

        {loading ? (
          <p style={{ color: colors.textMuted, textAlign: "center", padding: 40 }}>Chargement...</p>
        ) : !selectedYear ? (
          <p style={{ color: colors.textMuted, textAlign: "center", padding: 40 }}>Selectionnez une annee scolaire</p>
        ) : archiveData.length === 0 ? (
          <p style={{ color: colors.textMuted, textAlign: "center", padding: 40 }}>Aucune donnee archivee</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  {Object.keys(archiveData[0]).filter((k) => !k.startsWith("_")).slice(0, 6).map((key) => (
                    <th key={key} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {archiveData.slice(0, 50).map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {Object.entries(row).filter(([k]) => !k.startsWith("_")).slice(0, 6).map(([key, val]) => (
                      <td key={key} style={{ padding: "10px 14px", fontSize: 13, color: colors.text }}>
                        {typeof val === "object" ? JSON.stringify(val).slice(0, 50) : String(val ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {archiveData.length > 50 && (
              <p style={{ textAlign: "center", padding: 12, color: colors.textMuted, fontSize: 13 }}>
                Affichage des 50 premiers sur {archiveData.length}
              </p>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirmer l'archivage"
        message={`Archiver toutes les donnees pour l'annee ${newArchiveYear} ?${deleteOriginals ? "\n\nATTENTION: Les donnees originales seront supprimees !" : ""}`}
        variant={deleteOriginals ? "danger" : "warning"}
        onConfirm={handleArchive}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
