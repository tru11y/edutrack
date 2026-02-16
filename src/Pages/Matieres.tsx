import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useToast, ConfirmModal } from "../components/ui";
import {
  getMatieresSecure,
  createMatiereSecure,
  updateMatiereSecure,
  deleteMatiereSecure,
  getCloudFunctionErrorMessage,
  type MatiereResult,
} from "../services/cloudFunctions";

const COLORS_PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4"];

export default function Matieres() {
  const { colors } = useTheme();
  const toast = useToast();
  const [matieres, setMatieres] = useState<MatiereResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formNom, setFormNom] = useState("");
  const [formCoef, setFormCoef] = useState(1);
  const [formCouleur, setFormCouleur] = useState("#6366f1");
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });

  const loadData = async () => {
    try {
      const res = await getMatieresSecure();
      setMatieres(res.matieres);
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setFormNom(""); setFormCoef(1); setFormCouleur("#6366f1");
    setEditId(null); setShowForm(false);
  };

  const handleEdit = (m: MatiereResult) => {
    setEditId(m.id);
    setFormNom(m.nom);
    setFormCoef(m.coefficient);
    setFormCouleur(m.couleur);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formNom.trim()) { toast.error("Nom de la matiere requis."); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateMatiereSecure({ id: editId, nom: formNom, coefficient: formCoef, couleur: formCouleur });
        toast.success("Matiere mise a jour.");
      } else {
        await createMatiereSecure({ nom: formNom, coefficient: formCoef, couleur: formCouleur });
        toast.success("Matiere creee.");
      }
      resetForm();
      await loadData();
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, nom: string) => {
    setConfirmState({
      isOpen: true,
      title: "Supprimer la matiere",
      message: `Voulez-vous supprimer "${nom}" ? Cette action est irreversible.`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteMatiereSecure(id);
          toast.success("Matiere supprimee.");
          setConfirmState((p) => ({ ...p, isOpen: false }));
          await loadData();
        } catch (err) {
          toast.error(getCloudFunctionErrorMessage(err));
        }
      },
    });
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
    padding: "10px 20px",
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Matieres</h1>
          <p style={{ color: colors.textMuted, margin: "4px 0 0", fontSize: 14 }}>{matieres.length} matiere{matieres.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={btnPrimary}>
          {showForm ? "Fermer" : "+ Nouvelle matiere"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: colors.text, margin: "0 0 16px", fontSize: 16 }}>{editId ? "Modifier" : "Nouvelle"} matiere</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>Nom *</label>
              <input value={formNom} onChange={(e) => setFormNom(e.target.value)} style={inputStyle} placeholder="Ex: Mathematiques" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>Coefficient</label>
              <input type="number" value={formCoef} onChange={(e) => setFormCoef(Number(e.target.value))} style={inputStyle} min={1} max={10} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: "block", marginBottom: 6 }}>Couleur</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {COLORS_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormCouleur(c)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, background: c, border: formCouleur === c ? "3px solid " + colors.text : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button onClick={resetForm} style={{ ...btnPrimary, background: "transparent", color: colors.textMuted, border: `1px solid ${colors.border}` }}>Annuler</button>
            <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Enregistrement..." : editId ? "Modifier" : "Creer"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {matieres.map((m) => (
          <div key={m.id} style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.couleur}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: m.couleur }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: 0 }}>{m.nom}</p>
              <p style={{ fontSize: 12, color: colors.textMuted, margin: "2px 0 0" }}>Coefficient: {m.coefficient}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleEdit(m)} style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontSize: 13 }}>Modifier</button>
              <button onClick={() => handleDelete(m.id, m.nom)} style={{ background: "none", border: "none", color: colors.danger, cursor: "pointer", fontSize: 13 }}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onCancel={() => setConfirmState((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
      />
    </div>
  );
}
