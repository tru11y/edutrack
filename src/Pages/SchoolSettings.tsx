import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/ui";

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

interface SchoolConfig {
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

export default function SchoolSettings() {
  const { colors } = useTheme();
  const toast = useToast();
  const [config, setConfig] = useState<SchoolConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "config", "school"));
        if (snap.exists()) {
          setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as SchoolConfig);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "config", "school"), config, { merge: true });
      toast.success("Parametres de l'ecole enregistres.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
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
          {config.schoolLogo && (
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 10, fontWeight: 600 }}>Apercu du logo</label>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: colors.bg, borderRadius: 12 }}>
                <img
                  src={config.schoolLogo}
                  alt="Logo"
                  style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: config.primaryColor, margin: 0 }}>{config.schoolName}</p>
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: "2px 0 0" }}>{config.anneeScolaire}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
