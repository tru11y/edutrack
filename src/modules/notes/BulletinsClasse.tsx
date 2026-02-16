import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../components/ui";
import {
  generateBulletinsClasseSecure,
  getCloudFunctionErrorMessage,
} from "../../services/cloudFunctions";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getBulletinsByClasse } from "./notes.service";
import BulletinView from "./BulletinView";
import BulletinVersionHistory from "./BulletinVersionHistory";
import type { Bulletin, Trimestre } from "./notes.types";
import { TRIMESTRE_LABELS } from "./notes.types";

export default function BulletinsClasse() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const [versionBulletinId, setVersionBulletinId] = useState<string | null>(null);

  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedTrimestre, setSelectedTrimestre] = useState<Trimestre>(1);
  const [anneeScolaire, setAnneeScolaire] = useState(() => {
    const now = new Date();
    const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-${year + 1}`;
  });
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [elevesMap, setElevesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadClasses();
    loadEleves();
  }, []);

  useEffect(() => {
    if (selectedClasse) loadBulletins();
  }, [selectedClasse, selectedTrimestre, anneeScolaire]);

  async function loadClasses() {
    const snap = await getDocs(collection(db, "classes"));
    setClasses(snap.docs.map((d) => d.data().nom || d.id).sort());
  }

  async function loadEleves() {
    const snap = await getDocs(collection(db, "eleves"));
    const map: Record<string, string> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      map[d.id] = `${data.prenom} ${data.nom}`;
    });
    setElevesMap(map);
  }

  async function loadBulletins() {
    setLoading(true);
    try {
      const results = await getBulletinsByClasse(selectedClasse, selectedTrimestre, anneeScolaire);
      setBulletins(results.sort((a, b) => a.rang - b.rang));
    } catch {
      setBulletins([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedClasse) {
      toast.warning("Selectionnez une classe.");
      return;
    }
    setGenerating(true);
    try {
      const res = await generateBulletinsClasseSecure({
        classe: selectedClasse,
        trimestre: selectedTrimestre,
        anneeScolaire,
      });
      toast.success(res.message);
      loadBulletins();
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Bulletins</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: "4px 0 0" }}>
            Generez et consultez les bulletins par classe
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end",
      }}>
        <div>
          <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 4 }}>Classe</label>
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgCard, color: colors.text, fontSize: 13 }}
          >
            <option value="">Selectionnez une classe</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 4 }}>Trimestre</label>
          <select
            value={selectedTrimestre}
            onChange={(e) => setSelectedTrimestre(Number(e.target.value) as Trimestre)}
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgCard, color: colors.text, fontSize: 13 }}
          >
            {([1, 2, 3] as Trimestre[]).map((t) => (
              <option key={t} value={t}>{TRIMESTRE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 4 }}>Annee scolaire</label>
          <input
            type="text"
            value={anneeScolaire}
            onChange={(e) => setAnneeScolaire(e.target.value)}
            placeholder="2025-2026"
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgCard, color: colors.text, fontSize: 13, width: 120 }}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedClasse}
          style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: colors.primary, color: "#fff", cursor: generating ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 500, opacity: generating || !selectedClasse ? 0.6 : 1,
          }}
        >
          {generating ? "Generation..." : "Generer les bulletins"}
        </button>
      </div>

      {/* Results */}
      {!selectedClasse ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMuted }}>
          Selectionnez une classe pour voir les bulletins.
        </div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>Chargement...</div>
      ) : bulletins.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: colors.textMuted }}>
          <p style={{ fontSize: 16, fontWeight: 500 }}>Aucun bulletin genere</p>
          <p style={{ fontSize: 13 }}>Cliquez sur "Generer les bulletins" pour les creer.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bulletins.map((b) => (
            <div key={b.id || b.eleveId}>
              <BulletinView
                bulletin={b}
                eleveNom={elevesMap[b.eleveId] || b.eleveId}
              />
              {b.id && (
                <button
                  onClick={() => setVersionBulletinId(b.id!)}
                  style={{
                    marginTop: 4, padding: "6px 14px", background: colors.bgSecondary,
                    border: `1px solid ${colors.border}`, borderRadius: 8,
                    fontSize: 12, color: colors.textMuted, cursor: "pointer",
                  }}
                >
                  {t("versionHistory")}
                </button>
              )}
            </div>
          ))}
          {versionBulletinId && (
            <BulletinVersionHistory
              bulletinId={versionBulletinId}
              onClose={() => setVersionBulletinId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
