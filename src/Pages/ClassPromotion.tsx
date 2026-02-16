import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast, ConfirmModal } from "../components/ui";
import { promoteClasseSecure, getCloudFunctionErrorMessage } from "../services/cloudFunctions";

interface ClasseOption {
  id: string;
  nom: string;
}

interface ElevePreview {
  id: string;
  nom: string;
  prenom: string;
  classe: string;
}

export default function ClassPromotion() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [sourceClasse, setSourceClasse] = useState("");
  const [targetClasse, setTargetClasse] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState("");
  const [previewEleves, setPreviewEleves] = useState<ElevePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "classes")).then((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, nom: (d.data() as { nom: string }).nom }));
      setClasses(data.sort((a, b) => a.nom.localeCompare(b.nom)));
    });
  }, []);

  const handlePreview = async () => {
    if (!sourceClasse || !targetClasse || !anneeScolaire) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "eleves"), where("classe", "==", sourceClasse), where("statut", "==", "actif")));
      setPreviewEleves(snap.docs.map((d) => ({ id: d.id, ...(d.data() as { nom: string; prenom: string; classe: string }) })));
      setStep(2);
    } catch {
      toast.error("Erreur lors du chargement des eleves");
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    setConfirmOpen(false);
    setPromoting(true);
    try {
      const result = await promoteClasseSecure({ sourceClasse, targetClasse, anneeScolaire });
      if (result.success) {
        toast.success(result.message);
        setStep(3);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setPromoting(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", border: `1px solid ${colors.border}`,
    borderRadius: 10, fontSize: 14, background: colors.bgCard, color: colors.text,
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>
          {t("promoteClass")}
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
          Promouvoir les eleves d'une classe vers une autre
        </p>
      </div>

      {/* Steps indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: s <= step ? colors.primary : colors.border,
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      {step === 1 && (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 32, maxWidth: 500 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 24px" }}>
            Etape 1 : Selectionner les classes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Classe source</label>
              <select value={sourceClasse} onChange={(e) => setSourceClasse(e.target.value)} style={inputStyle}>
                <option value="">Choisir une classe</option>
                {classes.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Classe cible</label>
              <select value={targetClasse} onChange={(e) => setTargetClasse(e.target.value)} style={inputStyle}>
                <option value="">Choisir une classe</option>
                {classes.filter((c) => c.nom !== sourceClasse).map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Annee scolaire</label>
              <input type="text" value={anneeScolaire} onChange={(e) => setAnneeScolaire(e.target.value)} placeholder="2025-2026" style={inputStyle} />
            </div>
            <button
              onClick={handlePreview}
              disabled={!sourceClasse || !targetClasse || !anneeScolaire || loading}
              style={{
                padding: "14px 24px", background: colors.primary, color: colors.onGradient,
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: !sourceClasse || !targetClasse || !anneeScolaire ? "not-allowed" : "pointer",
                opacity: !sourceClasse || !targetClasse || !anneeScolaire ? 0.5 : 1,
              }}
            >
              {loading ? "Chargement..." : "Apercu des eleves"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 8px" }}>
            Etape 2 : Apercu
          </h2>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: "0 0 20px" }}>
            {previewEleves.length} eleve(s) seront promus de <strong>{sourceClasse}</strong> vers <strong>{targetClasse}</strong>
          </p>
          <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 20 }}>
            {previewEleves.map((e) => (
              <div key={e.id} style={{ padding: "10px 14px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: colors.primary }}>
                  {e.prenom[0]}{e.nom[0]}
                </div>
                <span style={{ fontSize: 14, color: colors.text }}>{e.prenom} {e.nom}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setStep(1)} style={{ padding: "12px 24px", background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, cursor: "pointer" }}>
              Retour
            </button>
            <button onClick={() => setConfirmOpen(true)} disabled={promoting} style={{ padding: "12px 24px", background: colors.primary, color: colors.onGradient, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              {promoting ? "Promotion en cours..." : "Confirmer la promotion"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: colors.successBg, borderRadius: 16, border: `1px solid ${colors.success}40`, padding: 40, textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: colors.success, margin: "0 auto 16px" }}>
            <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.success, margin: "0 0 8px" }}>Promotion reussie !</h2>
          <p style={{ fontSize: 14, color: colors.textMuted }}>
            {previewEleves.length} eleves ont ete promus de {sourceClasse} vers {targetClasse}.
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirmer la promotion"
        message={`Etes-vous sur de vouloir promouvoir ${previewEleves.length} eleves de ${sourceClasse} vers ${targetClasse} ?`}
        variant="warning"
        onConfirm={handlePromote}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
