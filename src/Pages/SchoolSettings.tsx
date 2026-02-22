import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { useSchool, type SchoolConfig } from "../context/SchoolContext";
import { useToast } from "../components/ui";
import { runDataMigrationSecure } from "../services/cloudFunctions";

const COLOR_PRESETS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Bleu", value: "#3b82f6" },
  { label: "Vert", value: "#10b981" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Rose", value: "#ec4899" },
  { label: "Orange", value: "#f97316" },
  { label: "Rouge", value: "#ef4444" },
  { label: "Cyan", value: "#06b6d4" },
];

export default function SchoolSettings() {
  const { colors } = useTheme();
  const { school, loading } = useSchool();
  const toast = useToast();
  const [config, setConfig] = useState<SchoolConfig>(school);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // Sync from context when it loads/updates
  useEffect(() => {
    setConfig(school);
  }, [school]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "config", "school"), config, { merge: true });
      toast.success("Parametres de l'ecole enregistres.");
    } catch {
      toast.error("Erreur lors de la sauvegarde. Verifiez vos permissions.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const btnPrimary = {
    padding: "12px 24px",
    background: colors.primary,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600 as const,
    cursor: "pointer",
  };

  if (loading) return <div style={{ padding: 32, color: colors.text }}>Chargement...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Parametres de l'ecole</h1>
        <p style={{ color: colors.textMuted, margin: "4px 0 0", fontSize: 14 }}>Personnalisez l'apparence et les informations de votre etablissement</p>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6, fontWeight: 600 }}>Nom de l'etablissement</label>
            <input
              value={config.schoolName}
              onChange={(e) => setConfig({ ...config, schoolName: e.target.value })}
              style={inputStyle}
              placeholder="Ex: Ecole Primaire ABC"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6, fontWeight: 600 }}>Annee scolaire</label>
            <input
              value={config.anneeScolaire}
              onChange={(e) => setConfig({ ...config, anneeScolaire: e.target.value })}
              style={inputStyle}
              placeholder="2025-2026"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6, fontWeight: 600 }}>URL du logo</label>
            <input
              value={config.schoolLogo}
              onChange={(e) => setConfig({ ...config, schoolLogo: e.target.value })}
              style={inputStyle}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6, fontWeight: 600 }}>Adresse</label>
            <input
              value={config.adresse}
              onChange={(e) => setConfig({ ...config, adresse: e.target.value })}
              style={inputStyle}
              placeholder="123 Rue de l'Ecole"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6, fontWeight: 600 }}>Telephone</label>
            <input
              value={config.telephone}
              onChange={(e) => setConfig({ ...config, telephone: e.target.value })}
              style={inputStyle}
              placeholder="+225 XX XX XX XX"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6, fontWeight: 600 }}>Email</label>
            <input
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              style={inputStyle}
              placeholder="contact@ecole.com"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 10, fontWeight: 600 }}>Couleur principale</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setConfig({ ...config, primaryColor: c.value })}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: 12, borderRadius: 10, cursor: "pointer",
                    background: config.primaryColor === c.value ? `${c.value}15` : "transparent",
                    border: config.primaryColor === c.value ? `2px solid ${c.value}` : `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: c.value }} />
                  <span style={{ fontSize: 11, color: colors.textMuted }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 10, fontWeight: 600 }}>Apercu</label>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: colors.bg, borderRadius: 12 }}>
              {config.schoolLogo ? (
                <img
                  src={config.schoolLogo}
                  alt="Logo"
                  style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 8, background: config.primaryColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 24 }}>{config.schoolName?.[0]?.toUpperCase() || "E"}</span>
                </div>
              )}
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: config.primaryColor, margin: 0 }}>{config.schoolName || "EduTrack"}</p>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: "2px 0 0" }}>{config.anneeScolaire}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Migration section */}
      <div style={{ background: colors.surface, borderRadius: 16, padding: 28, border: `1px solid ${colors.warning}40` }}>
        <h3 style={{ margin: "0 0 6px", color: colors.warning, fontSize: 15, fontWeight: 700 }}>Migration des donnees</h3>
        <p style={{ margin: "0 0 16px", color: colors.textSecondary, fontSize: 13 }}>
          Si vos donnees existantes (eleves, classes, paiements…) n'apparaissent pas dans les statistiques,
          lancez la migration pour les associer a votre ecole.
        </p>
        <button
          disabled={migrating}
          onClick={async () => {
            setMigrating(true);
            try {
              const res = await runDataMigrationSecure();
              toast.success(`Migration reussie : ${res.totalMigrated} document(s) mis a jour.`);
            } catch {
              toast.error("Erreur lors de la migration.");
            } finally {
              setMigrating(false);
            }
          }}
          style={{ ...btnPrimary, background: colors.warning, opacity: migrating ? 0.6 : 1 }}
        >
          {migrating ? "Migration en cours..." : "Lancer la migration"}
        </button>
      </div>
    </div>
  );
}
