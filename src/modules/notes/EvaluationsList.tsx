import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast, ConfirmModal } from "../../components/ui";
import {
  getEvaluationsByClasseSecure,
  deleteEvaluationSecure,
  exportNotesExcelSecure,
  getCloudFunctionErrorMessage,
  type EvaluationResult,
} from "../../services/cloudFunctions";
import { downloadBase64File } from "../../utils/download";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { EVALUATION_TYPE_LABELS, TRIMESTRE_LABELS, type EvaluationType, type Trimestre } from "./notes.types";

export default function EvaluationsList() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "gestionnaire";

  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClasse, setFilterClasse] = useState("");
  const [filterMatiere, setFilterMatiere] = useState("");
  const [filterTrimestre, setFilterTrimestre] = useState<number | "">("");
  const [classes, setClasses] = useState<string[]>([]);
  const [matieres, setMatieres] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });

  useEffect(() => {
    loadClasses();
    loadMatieres();
  }, []);

  useEffect(() => {
    loadEvaluations();
  }, [filterClasse, filterMatiere, filterTrimestre]);

  async function loadClasses() {
    const snap = await getDocs(collection(db, "classes"));
    setClasses(snap.docs.map((d) => d.data().nom || d.id).sort());
  }

  async function loadMatieres() {
    const snap = await getDocs(collection(db, "matieres"));
    setMatieres(snap.docs.map((d) => d.data().nom || d.id).sort());
  }

  async function loadEvaluations() {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filterClasse) params.classe = filterClasse;
      if (filterMatiere) params.matiere = filterMatiere;
      if (filterTrimestre) params.trimestre = filterTrimestre;
      if (user?.role === "prof") params.professeurId = user.uid;

      const res = await getEvaluationsByClasseSecure(params);
      setEvaluations(res.evaluations || []);
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string, titre: string) {
    setConfirmState({
      isOpen: true,
      title: "Supprimer l'evaluation",
      message: `Supprimer "${titre}" et toutes ses notes ?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteEvaluationSecure(id);
          toast.success("Evaluation supprimee.");
          loadEvaluations();
        } catch (err) {
          toast.error(getCloudFunctionErrorMessage(err));
        }
        setConfirmState((s) => ({ ...s, isOpen: false }));
      },
    });
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "examen": return { bg: colors.dangerBg, text: colors.danger };
      case "devoir": return { bg: colors.primaryBg, text: colors.primary };
      case "interro": return { bg: colors.warningBg, text: colors.warning };
      default: return { bg: colors.bgHover, text: colors.textMuted };
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Evaluations</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: "4px 0 0" }}>
            Gerez les evaluations et saisissez les notes
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={async () => {
              setExporting(true);
              try {
                const res = await exportNotesExcelSecure({ classe: filterClasse || undefined, trimestre: filterTrimestre || undefined });
                downloadBase64File(res.data, res.filename);
                toast.success("Export telecharge");
              } catch { toast.error("Erreur lors de l'export"); }
              finally { setExporting(false); }
            }}
            disabled={exporting}
            style={{ padding: "10px 20px", background: colors.bgHover, color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.7 : 1 }}
          >
            {exporting ? "Export..." : "Exporter"}
          </button>
          <Link to="/evaluations/nouvelle" style={{
            padding: "10px 20px", background: colors.primary, color: "#fff", borderRadius: 8,
            textDecoration: "none", fontSize: 14, fontWeight: 500,
          }}>
            + Nouvelle evaluation
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgCard, color: colors.text, fontSize: 13 }}
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterMatiere}
          onChange={(e) => setFilterMatiere(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgCard, color: colors.text, fontSize: 13 }}
        >
          <option value="">Toutes les matieres</option>
          {matieres.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={filterTrimestre}
          onChange={(e) => setFilterTrimestre(e.target.value ? Number(e.target.value) : "")}
          style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgCard, color: colors.text, fontSize: 13 }}
        >
          <option value="">Tous les trimestres</option>
          {([1, 2, 3] as Trimestre[]).map((t) => (
            <option key={t} value={t}>{TRIMESTRE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Chargement...</div>
      ) : evaluations.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMuted }}>
          <p style={{ fontSize: 48, margin: 0 }}>📝</p>
          <p style={{ fontSize: 16, fontWeight: 500, margin: "12px 0 4px" }}>Aucune evaluation</p>
          <p style={{ fontSize: 13 }}>Creez une evaluation pour commencer</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {evaluations.map((ev) => {
            const badge = getTypeBadgeColor(ev.type);
            return (
              <div key={ev.id} style={{
                background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12,
                padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: colors.text }}>{ev.titre}</span>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                      background: badge.bg, color: badge.text,
                    }}>
                      {EVALUATION_TYPE_LABELS[ev.type as EvaluationType] || ev.type}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: colors.textMuted, flexWrap: "wrap" }}>
                    <span>{ev.classe}</span>
                    <span>{ev.matiere}</span>
                    <span>{ev.date}</span>
                    <span>Coef. {ev.coefficient}</span>
                    <span>/ {ev.maxNote}</span>
                    <span>{TRIMESTRE_LABELS[ev.trimestre as Trimestre]}</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                    Par {ev.professeurNom}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to={`/evaluations/${ev.id}/notes`} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: colors.successBg, color: colors.success, textDecoration: "none",
                    border: `1px solid ${colors.success}30`,
                  }}>
                    Notes
                  </Link>
                  {(isAdmin || ev.professeurId === user?.uid) && (
                    <Link to={`/evaluations/${ev.id}/modifier`} style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: colors.primaryBg, color: colors.primary, textDecoration: "none",
                      border: `1px solid ${colors.primary}30`,
                    }}>
                      Modifier
                    </Link>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(ev.id, ev.titre)} style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                      background: colors.dangerBg, color: colors.danger, border: `1px solid ${colors.danger}30`,
                      cursor: "pointer",
                    }}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
      />
    </div>
  );
}
