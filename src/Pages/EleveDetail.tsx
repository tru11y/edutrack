import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getEleveById, desactiverEleve, moveEleveToTrash } from "../modules/eleves/eleve.service";
import { getPaiementsByEleve } from "../modules/paiements/paiement.service";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { Eleve } from "../modules/eleves/eleve.types";
import type { Paiement } from "../modules/paiements/paiement.types";

export default function EleveDetail() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isGestionnaire = user?.role === "gestionnaire";
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [eleve, setEleve] = useState<Eleve | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getEleveById(id), getPaiementsByEleve(id)])
      .then(([eleveData, paiementsData]) => {
        setEleve(eleveData);
        setPaiements(paiementsData);
        setLoading(false);
      })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [id]);

  const handleDesactiver = async () => {
    if (!id || !confirm("Desactiver cet eleve ?")) return;
    await desactiverEleve(id);
    navigate("/eleves");
  };

  const handleDelete = async () => {
    if (!id || !confirm(`Supprimer ${eleve?.prenom} ${eleve?.nom} ?\n\nL'eleve sera deplace dans la corbeille.`)) return;
    try {
      await moveEleveToTrash(id);
      navigate("/eleves");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!eleve) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ fontSize: 16, color: colors.textMuted }}>Eleve introuvable</p>
        <Link to="/eleves" style={{ color: colors.primary }}>Retour a la liste</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Link to="/eleves" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.textMuted, textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour aux eleves
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Profil Eleve</h1>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to={`/eleves/${id}/modifier`} style={{ padding: "10px 20px", background: colors.primary, color: colors.onGradient, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Modifier</Link>
            <button onClick={handleDesactiver} style={{ padding: "10px 20px", background: colors.warningBg, color: colors.warning, border: `1px solid ${colors.warning}40`, borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Desactiver</button>
            <button onClick={handleDelete} style={{ padding: "10px 20px", background: colors.dangerBg, color: colors.danger, border: `1px solid ${colors.danger}`, borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Supprimer</button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div style={{ padding: 24, background: eleve.sexe === "M" ? colors.gradientMale : colors.gradientFemale, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: colors.onGradientOverlay, display: "flex", alignItems: "center", justifyContent: "center", color: colors.onGradient, fontSize: 28, fontWeight: 700 }}>{eleve.prenom[0]}{eleve.nom[0]}</div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: colors.onGradient, margin: "0 0 4px" }}>{eleve.prenom} {eleve.nom}</h2>
              <p style={{ fontSize: 14, color: colors.onGradientMuted, margin: 0 }}>{eleve.classe}</p>
            </div>
            <span style={{ marginLeft: "auto", padding: "8px 16px", background: eleve.statut === "actif" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)", color: colors.onGradient, borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{eleve.statut === "actif" ? "Actif" : "Inactif"}</span>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div><p style={{ fontSize: 12, color: colors.textLight, marginBottom: 4, textTransform: "uppercase", fontWeight: 600 }}>Sexe</p><p style={{ fontSize: 15, color: colors.text, margin: 0, fontWeight: 500 }}>{eleve.sexe === "M" ? "Masculin" : "Feminin"}</p></div>
              <div><p style={{ fontSize: 12, color: colors.textLight, marginBottom: 4, textTransform: "uppercase", fontWeight: 600 }}>Classe</p><p style={{ fontSize: 15, color: colors.text, margin: 0, fontWeight: 500 }}>{eleve.classe}</p></div>
            </div>
            {eleve.parents && eleve.parents.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, margin: "0 0 12px", textTransform: "uppercase" }}>Parents / Tuteurs</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {eleve.parents.map((parent, i) => (
                    <div key={i} style={{ padding: 16, background: colors.bg, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><p style={{ margin: 0, fontWeight: 500, color: colors.text }}>{parent.nom}</p><p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>{parent.lien === "pere" ? "Pere" : parent.lien === "mere" ? "Mere" : "Tuteur"}</p></div>
                      <a href={`tel:${parent.telephone}`} style={{ padding: "8px 16px", background: colors.successBg, color: colors.success, borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{parent.telephone}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>Historique des paiements</h2>
            <Link to={`/paiements/nouveau?eleveId=${id}`} style={{ padding: "8px 16px", background: colors.primaryBg, color: colors.primary, borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 500 }}>+ Nouveau</Link>
          </div>
          {paiements.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: colors.bg, borderRadius: 12 }}><p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>Aucun paiement</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {paiements.map((p) => (
                <div key={p.id} style={{ padding: 16, background: colors.bg, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, color: colors.text }}>{new Date(p.mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
                    {!isGestionnaire && <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>{p.montantPaye.toLocaleString()} / {p.montantTotal.toLocaleString()} FCFA</p>}
                  </div>
                  <span style={{ padding: "6px 12px", background: p.statut === "paye" ? colors.successBg : p.statut === "partiel" ? colors.warningBg : colors.dangerBg, color: p.statut === "paye" ? colors.success : p.statut === "partiel" ? colors.warning : colors.danger, borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{p.statut === "paye" ? "Paye" : p.statut === "partiel" ? "Partiel" : "Impaye"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
