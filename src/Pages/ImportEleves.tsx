import { useState, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/ui";
import {
  importElevesCsvSecure,
  getCloudFunctionErrorMessage,
  type EleveImportRow,
} from "../services/cloudFunctions";

export default function ImportEleves() {
  const { colors } = useTheme();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<EleveImportRow[]>([]);
  const [preview, setPreview] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    totalRows: number; validRows: number; errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const parseCSV = (text: string): EleveImportRow[] => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(/[;,]/).map((h) => h.trim().toLowerCase());
    const nomIdx = headers.findIndex((h) => h === "nom");
    const prenomIdx = headers.findIndex((h) => h === "prenom");
    const classeIdx = headers.findIndex((h) => h === "classe");
    const sexeIdx = headers.findIndex((h) => h === "sexe");
    const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("naissance"));
    const telIdx = headers.findIndex((h) => h.includes("tel") || h.includes("phone"));
    const adresseIdx = headers.findIndex((h) => h.includes("adresse") || h.includes("address"));

    if (nomIdx === -1 || prenomIdx === -1 || classeIdx === -1) {
      toast.error("Le CSV doit contenir les colonnes: nom, prenom, classe");
      return [];
    }

    const result: EleveImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[;,]/).map((c) => c.trim());
      if (!cols[nomIdx] && !cols[prenomIdx]) continue;
      result.push({
        nom: cols[nomIdx] || "",
        prenom: cols[prenomIdx] || "",
        classe: cols[classeIdx] || "",
        sexe: sexeIdx >= 0 ? cols[sexeIdx] : undefined,
        dateNaissance: dateIdx >= 0 ? cols[dateIdx] : undefined,
        telephone: telIdx >= 0 ? cols[telIdx] : undefined,
        adresse: adresseIdx >= 0 ? cols[adresseIdx] : undefined,
      });
    }
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setPreview(true);
      setValidationResult(null);
      setImported(false);
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    setImporting(true);
    try {
      const res = await importElevesCsvSecure({ rows, dryRun: true });
      setValidationResult({
        totalRows: res.totalRows || rows.length,
        validRows: res.validRows || 0,
        errors: res.errors,
      });
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await importElevesCsvSecure({ rows, dryRun: false });
      toast.success(res.message || `${res.imported} eleves importes.`);
      setImported(true);
    } catch (err) {
      toast.error(getCloudFunctionErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setRows([]); setPreview(false); setValidationResult(null); setImported(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const inputStyle = {
    padding: "10px 14px",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Import eleves (CSV)</h1>
        <p style={{ color: colors.textMuted, margin: "4px 0 0", fontSize: 14 }}>Importez des eleves a partir d'un fichier CSV</p>
      </div>

      {/* Upload zone */}
      {!preview && (
        <div style={{
          background: colors.bgCard, borderRadius: 12, border: `2px dashed ${colors.border}`, padding: 48,
          textAlign: "center", cursor: "pointer",
        }}
          onClick={() => fileRef.current?.click()}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 16px", display: "block" }}>
            <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ color: colors.text, fontSize: 16, fontWeight: 500, margin: "0 0 8px" }}>Cliquez pour selectionner un fichier CSV</p>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>Format attendu: nom, prenom, classe (+ sexe, dateNaissance, telephone, adresse en optionnel)</p>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange} style={{ display: "none" }} />
        </div>
      )}

      {/* Preview */}
      {preview && !imported && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ color: colors.text, fontSize: 14, margin: 0 }}>
              <strong>{rows.length}</strong> lignes detectees
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleReset} style={{ ...inputStyle, cursor: "pointer" }}>Recommencer</button>
              {!validationResult && (
                <button onClick={handleValidate} disabled={importing} style={{ ...btnPrimary, background: colors.warning, opacity: importing ? 0.6 : 1 }}>
                  {importing ? "Validation..." : "Valider"}
                </button>
              )}
              {validationResult && validationResult.validRows > 0 && (
                <button onClick={handleImport} disabled={importing} style={{ ...btnPrimary, opacity: importing ? 0.6 : 1 }}>
                  {importing ? "Import en cours..." : `Importer ${validationResult.validRows} eleves`}
                </button>
              )}
            </div>
          </div>

          {/* Validation errors */}
          {validationResult && validationResult.errors.length > 0 && (
            <div style={{ background: `${colors.danger}10`, border: `1px solid ${colors.danger}40`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <p style={{ color: colors.danger, fontWeight: 600, margin: "0 0 8px" }}>
                {validationResult.errors.length} erreur{validationResult.errors.length > 1 ? "s" : ""}
              </p>
              {validationResult.errors.slice(0, 10).map((e, i) => (
                <p key={i} style={{ color: colors.danger, fontSize: 13, margin: "4px 0" }}>
                  Ligne {e.row}: {e.message}
                </p>
              ))}
              {validationResult.errors.length > 10 && (
                <p style={{ color: colors.danger, fontSize: 13, fontStyle: "italic" }}>... et {validationResult.errors.length - 10} autres erreurs</p>
              )}
            </div>
          )}

          {validationResult && validationResult.errors.length === 0 && (
            <div style={{ background: `${colors.success}10`, border: `1px solid ${colors.success}40`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <p style={{ color: colors.success, fontWeight: 600, margin: 0 }}>Toutes les lignes sont valides. Pret a importer !</p>
            </div>
          )}

          {/* Table preview */}
          <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "auto", maxHeight: 400 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: colors.bgSecondary, position: "sticky", top: 0 }}>
                <tr>
                  {["#", "Nom", "Prenom", "Classe", "Sexe", "Date naissance", "Telephone"].map((h) => (
                    <th key={h} style={{ padding: 10, textAlign: "left", color: colors.textSecondary, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${colors.borderLight}` : "none" }}>
                    <td style={{ padding: 10, color: colors.textMuted, fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: 10, color: colors.text, fontSize: 13 }}>{r.nom}</td>
                    <td style={{ padding: 10, color: colors.text, fontSize: 13 }}>{r.prenom}</td>
                    <td style={{ padding: 10, color: colors.text, fontSize: 13 }}>{r.classe}</td>
                    <td style={{ padding: 10, color: colors.text, fontSize: 13 }}>{r.sexe || "-"}</td>
                    <td style={{ padding: 10, color: colors.text, fontSize: 13 }}>{r.dateNaissance || "-"}</td>
                    <td style={{ padding: 10, color: colors.text, fontSize: 13 }}>{r.telephone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 50 && <p style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>Affichage des 50 premieres lignes sur {rows.length}</p>}
        </div>
      )}

      {imported && (
        <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 48, textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 16px", display: "block" }}>
            <path d="M20 6L9 17L4 12" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ color: colors.text, fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>Import termine !</p>
          <button onClick={handleReset} style={btnPrimary}>Nouvel import</button>
        </div>
      )}
    </div>
  );
}
