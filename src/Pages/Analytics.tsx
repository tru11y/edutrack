import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { BarChart, LineChart, CircularProgress } from "../components/charts";
import {
  getAnalyticsReportSecure,
  getCloudFunctionErrorMessage,
  type AnalyticsReport,
  type AnalyticsReportType,
} from "../services/cloudFunctions";
import { exportAnalyticsPDF } from "../utils/pdfExports";

interface ClasseOption { id: string; nom: string }
interface MatiereOption { id: string; nom: string }

export default function Analytics() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [reportType, setReportType] = useState<AnalyticsReportType>("comprehensive");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [classe, setClasse] = useState("");
  const [matiere, setMatiere] = useState("");
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [matieres, setMatieres] = useState<MatiereOption[]>([]);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "classes")),
      getDocs(collection(db, "matieres")),
    ]).then(([classesSnap, matieresSnap]) => {
      setClasses(classesSnap.docs.map((d) => ({ id: d.id, nom: (d.data() as { nom: string }).nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
      setMatieres(matieresSnap.docs.map((d) => ({ id: d.id, nom: (d.data() as { nom: string }).nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
    });
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAnalyticsReportSecure({
        type: reportType,
        ...(dateStart && { dateStart }),
        ...(dateEnd && { dateEnd }),
        ...(classe && { classe }),
        ...(matiere && { matiere }),
      });
      setReport(result.report);
    } catch (err) {
      setError(getCloudFunctionErrorMessage(err));
    } finally {
      setLoading(false);
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
          {t("analytics")}
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
          {t("reports")} et analyses detaillees
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Type de rapport</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value as AnalyticsReportType)} style={inputStyle}>
              <option value="comprehensive">Complet</option>
              <option value="attendance">Presences</option>
              <option value="grades">Notes</option>
              <option value="payments">Paiements</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Date debut</label>
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Date fin</label>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Classe</label>
            <select value={classe} onChange={(e) => setClasse(e.target.value)} style={inputStyle}>
              <option value="">Toutes</option>
              {classes.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Matiere</label>
            <select value={matiere} onChange={(e) => setMatiere(e.target.value)} style={inputStyle}>
              <option value="">Toutes</option>
              {matieres.map((m) => <option key={m.id} value={m.nom}>{m.nom}</option>)}
            </select>
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            style={{
              padding: "10px 24px", background: colors.primary, color: colors.onGradient,
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Chargement..." : t("generateReport")}
          </button>
          {report && (
            <button
              onClick={() => exportAnalyticsPDF(report)}
              style={{
                padding: "10px 24px", background: colors.successBg, color: colors.success,
                border: `1px solid ${colors.success}40`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}
            >
              Export PDF
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 12, marginBottom: 24 }}>
          <p style={{ color: colors.danger, margin: 0 }}>{error}</p>
        </div>
      )}

      {report && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Attendance Section */}
          {report.attendance && (
            <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Presences</h2>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center" }}>
                <CircularProgress
                  percentage={report.attendance.tauxPresence}
                  color={report.attendance.tauxPresence >= 80 ? colors.success : colors.warning}
                  label="Taux de presence"
                  size={130}
                />
                <div>
                  {Object.keys(report.attendance.byClasse).length > 0 && (
                    <BarChart
                      labels={Object.keys(report.attendance.byClasse)}
                      datasets={[
                        { label: "Presents", data: Object.values(report.attendance.byClasse).map((c) => c.present), color: colors.success },
                        { label: "Absents", data: Object.values(report.attendance.byClasse).map((c) => c.absent), color: colors.danger },
                      ]}
                      height={200}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grades Section */}
          {report.grades && (
            <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Notes</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                <div style={{ textAlign: "center", padding: 16, background: colors.bgSecondary, borderRadius: 12 }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>{report.grades.moyenneGenerale}/20</p>
                  <p style={{ fontSize: 12, color: colors.textMuted }}>Moyenne generale</p>
                </div>
                <div style={{ textAlign: "center", padding: 16, background: colors.bgSecondary, borderRadius: 12 }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: colors.success }}>{report.grades.tauxReussite}%</p>
                  <p style={{ fontSize: 12, color: colors.textMuted }}>Taux de reussite</p>
                </div>
                <div style={{ textAlign: "center", padding: 16, background: colors.bgSecondary, borderRadius: 12 }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{Object.keys(report.grades.byMatiere).length}</p>
                  <p style={{ fontSize: 12, color: colors.textMuted }}>Matieres</p>
                </div>
              </div>
              {Object.keys(report.grades.byMatiere).length > 0 && (
                <BarChart
                  labels={Object.keys(report.grades.byMatiere)}
                  datasets={[{ label: "Taux reussite (%)", data: Object.values(report.grades.byMatiere).map((m) => m.tauxReussite), color: colors.primary }]}
                  height={220}
                />
              )}
            </div>
          )}

          {/* Payments Section */}
          {report.payments && (
            <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Paiements</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <div style={{ textAlign: "center", padding: 16, background: colors.bgSecondary, borderRadius: 12 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: colors.success }}>{report.payments.totalPaye.toLocaleString()} F</p>
                  <p style={{ fontSize: 12, color: colors.textMuted }}>Total paye</p>
                </div>
                <div style={{ textAlign: "center", padding: 16, background: colors.bgSecondary, borderRadius: 12 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: colors.warning }}>{report.payments.totalAttendu.toLocaleString()} F</p>
                  <p style={{ fontSize: 12, color: colors.textMuted }}>Total attendu</p>
                </div>
                <div style={{ textAlign: "center", padding: 16, background: colors.bgSecondary, borderRadius: 12 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: report.payments.tauxRecouvrement >= 80 ? colors.success : colors.danger }}>{report.payments.tauxRecouvrement}%</p>
                  <p style={{ fontSize: 12, color: colors.textMuted }}>Recouvrement</p>
                </div>
              </div>
            </div>
          )}

          {/* Correlations */}
          {report.correlations && report.correlations.length > 0 && (
            <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Correlations presence / notes</h2>
              <LineChart
                labels={report.correlations.map((c) => c.classe)}
                datasets={[
                  { label: "Presence (%)", data: report.correlations.map((c) => c.tauxPresence), color: colors.success },
                  { label: "Moyenne", data: report.correlations.map((c) => c.moyenneNotes), color: colors.primary },
                ]}
                height={220}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
