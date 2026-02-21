import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { callFunction } from "../services/cloudFunctions";

interface TransportRoute {
  id: string;
  nom: string;
  arrets: string[];
  chauffeur: string;
  telephone: string;
  eleves: string[];
}

export default function Transport() {
  const { colors } = useTheme();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [arrets, setArrets] = useState("");
  const [chauffeur, setChauffeur] = useState("");
  const [telephone, setTelephone] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRoutes = useCallback(async () => {
    try {
      const res = await callFunction<{ routes: TransportRoute[] }>("listRoutes", {});
      setRoutes(res.routes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoutes(); }, [loadRoutes]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await callFunction("createRoute", {
        nom,
        arrets: arrets.split(",").map((a) => a.trim()).filter(Boolean),
        chauffeur,
        telephone,
      });
      setNom(""); setArrets(""); setChauffeur(""); setTelephone("");
      setShowForm(false);
      loadRoutes();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await callFunction("deleteRoute", { id });
      loadRoutes();
    } catch (err) {
      console.error(err);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`, borderRadius: 8,
    fontSize: 14, outline: "none", boxSizing: "border-box" as const, background: colors.cardBg, color: colors.text,
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>Transport scolaire</h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
          cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>
          {showForm ? "Annuler" : "+ Nouvelle route"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: colors.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}`, marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de la route" style={inputStyle} />
            <input value={arrets} onChange={(e) => setArrets(e.target.value)} placeholder="Arrets (separes par des virgules)" style={inputStyle} />
            <div style={{ display: "flex", gap: 12 }}>
              <input value={chauffeur} onChange={(e) => setChauffeur(e.target.value)} placeholder="Nom du chauffeur" style={{ ...inputStyle, flex: 1 }} />
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Telephone" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <button onClick={handleCreate} disabled={saving || !nom.trim()} style={{
              padding: "10px", background: nom.trim() ? "#6366f1" : "#d1d5db", color: "#fff", border: "none",
              borderRadius: 8, cursor: nom.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 14,
            }}>
              {saving ? "Enregistrement..." : "Creer la route"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: colors.textSecondary }}>Chargement...</p>
      ) : routes.length === 0 ? (
        <p style={{ color: colors.textSecondary }}>Aucune route configuree.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {routes.map((route) => (
            <div key={route.id} style={{ background: colors.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>{route.nom}</h3>
                <button onClick={() => handleDelete(route.id)} style={{
                  padding: "4px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6,
                  cursor: "pointer", fontSize: 12, fontWeight: 500,
                }}>
                  Supprimer
                </button>
              </div>
              {route.chauffeur && (
                <p style={{ fontSize: 13, color: colors.textSecondary, margin: "0 0 4px" }}>
                  Chauffeur: {route.chauffeur} {route.telephone ? `(${route.telephone})` : ""}
                </p>
              )}
              {route.arrets.length > 0 && (
                <p style={{ fontSize: 13, color: colors.textSecondary, margin: "0 0 4px" }}>
                  Arrets: {route.arrets.join(" → ")}
                </p>
              )}
              <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0 }}>
                {route.eleves.length} eleve{route.eleves.length !== 1 ? "s" : ""} affecte{route.eleves.length !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
