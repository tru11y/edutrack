import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getProfesseurById,
  updateProfesseur,
  desactiverProfesseur,
} from "./professeur.service";
import { useTheme } from "../../context/ThemeContext";
import type { Professeur } from "./professeur.types";

export default function ProfesseurProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colors } = useTheme();

  const [prof, setProf] = useState<Professeur | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    matieres: "",
    classes: "",
  });

  useEffect(() => {
    if (!id) return;
    getProfesseurById(id).then((data) => {
      if (!data) {
        setLoading(false);
        return;
      }
      setProf(data);
      setForm({
        nom: data.nom || "",
        prenom: data.prenom || "",
        telephone: data.telephone || "",
        matieres: (data.matieres || []).join(", "),
        classes: (data.classes || []).join(", "),
      });
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateProfesseur(id, {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        matieres: form.matieres.split(",").map((m) => m.trim()).filter(Boolean),
        classes: form.classes.split(",").map((c) => c.trim()).filter(Boolean),
      });
      setProf({
        ...prof!,
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        matieres: form.matieres.split(",").map((m) => m.trim()).filter(Boolean),
        classes: form.classes.split(",").map((c) => c.trim()).filter(Boolean),
      });
      setEditing(false);
    } catch {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Desactiver ce professeur ?")) return;
    await desactiverProfesseur(id);
    navigate("/admin/professeurs");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary,
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
          }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!prof) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ fontSize: 16, color: colors.textMuted }}>Professeur introuvable</p>
        <Link to="/admin/professeurs" style={{ color: colors.primary }}>Retour a la liste</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Link
          to="/admin/professeurs"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: colors.textMuted,
            textDecoration: "none",
            fontSize: 14,
            marginBottom: 16
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour aux professeurs
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>
            Profil Professeur
          </h1>
          {!editing && (
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: "10px 20px",
                  background: colors.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M11.33 2.67C11.51 2.49 11.72 2.35 11.95 2.25C12.18 2.15 12.43 2.1 12.68 2.1C12.93 2.1 13.18 2.15 13.41 2.25C13.64 2.35 13.85 2.49 14.03 2.67C14.21 2.85 14.35 3.06 14.45 3.29C14.55 3.52 14.6 3.77 14.6 4.02C14.6 4.27 14.55 4.52 14.45 4.75C14.35 4.98 14.21 5.19 14.03 5.37L5.17 14.23L1.33 15.33L2.43 11.49L11.33 2.67Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Modifier
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "10px 20px",
                  background: colors.dangerBg,
                  color: colors.danger,
                  border: `1px solid ${colors.danger}40`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Desactiver
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div style={{
        background: colors.bgCard,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        overflow: "hidden"
      }}>
        {/* Header with avatar */}
        <div style={{
          padding: 24,
          background: `linear-gradient(135deg, ${colors.primary} 0%, #a855f7 100%)`,
          display: "flex",
          alignItems: "center",
          gap: 20
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 28,
            fontWeight: 700
          }}>
            {prof.prenom?.[0]}{prof.nom?.[0]}
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
              {prof.prenom} {prof.nom}
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>
              Professeur
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span style={{
              padding: "8px 16px",
              background: prof.statut === "actif" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: "#fff",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600
            }}>
              {prof.statut === "actif" ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
                    Nom
                  </label>
                  <input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                      fontSize: 14,
                      boxSizing: "border-box",
                      background: colors.bgInput,
                      color: colors.text,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
                    Prenom
                  </label>
                  <input
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                      fontSize: 14,
                      boxSizing: "border-box",
                      background: colors.bgInput,
                      color: colors.text,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
                  Telephone
                </label>
                <input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    fontSize: 14,
                    boxSizing: "border-box",
                    background: colors.bgInput,
                    color: colors.text,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
                  Matieres (separees par des virgules)
                </label>
                <input
                  value={form.matieres}
                  onChange={(e) => setForm({ ...form, matieres: e.target.value })}
                  placeholder="Maths, Physique, Chimie"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    fontSize: 14,
                    boxSizing: "border-box",
                    background: colors.bgInput,
                    color: colors.text,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
                  Classes (separees par des virgules)
                </label>
                <input
                  value={form.classes}
                  onChange={(e) => setForm({ ...form, classes: e.target.value })}
                  placeholder="6eme, 5eme, 4eme"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    fontSize: 14,
                    boxSizing: "border-box",
                    background: colors.bgInput,
                    color: colors.text,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "12px 24px",
                    background: colors.success,
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    padding: "12px 24px",
                    background: colors.bgSecondary,
                    color: colors.textMuted,
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <InfoBlock label="Nom" value={prof.nom} colors={colors} />
              <InfoBlock label="Prenom" value={prof.prenom} colors={colors} />
              <InfoBlock label="Telephone" value={prof.telephone || "Non renseigne"} colors={colors} />
              <InfoBlock label="Statut" value={prof.statut === "actif" ? "Actif" : "Inactif"} colors={colors} />

              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ fontSize: 12, color: colors.textLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                  Matieres
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {prof.matieres && prof.matieres.length > 0 ? (
                    prof.matieres.map((m, i) => (
                      <span key={i} style={{
                        padding: "6px 14px",
                        background: colors.primaryBg,
                        color: colors.primary,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        {m}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: colors.textLight, fontSize: 14 }}>Aucune matiere</span>
                  )}
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ fontSize: 12, color: colors.textLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                  Classes
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {prof.classes && prof.classes.length > 0 ? (
                    prof.classes.map((c, i) => (
                      <span key={i} style={{
                        padding: "6px 14px",
                        background: colors.infoBg,
                        color: colors.info,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        {c}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: colors.textLight, fontSize: 14 }}>Aucune classe</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: colors.textLight, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: 16, color: colors.text, margin: 0, fontWeight: 500 }}>
        {value}
      </p>
    </div>
  );
}
