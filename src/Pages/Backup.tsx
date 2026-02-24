import { useEffect, useState } from "react";
import {
  collection, query, where, orderBy, limit, getDocs, onSnapshot,
  doc, updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSchool } from "../context/SchoolContext";
import { exportSchoolBackupSecure } from "../services/cloudFunctions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EXPORT_COLLECTIONS = [
  "eleves", "paiements", "presences", "cours",
  "notes", "evaluations", "matieres", "salaires",
  "depenses", "cahier", "emploi_du_temps", "classes",
];

interface BackupRecord {
  id: string;
  triggeredBy: string;
  totalDocs: number;
  collectionCounts: Record<string, number>;
  status: string;
  webhookSent: boolean;
  timestamp: { toDate: () => Date } | null;
}

export default function Backup() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { school } = useSchool();
  const schoolId = (user as unknown as { schoolId?: string })?.schoolId || "";

  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(school?.backupWebhookUrl || "");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync webhook URL from school context
  useEffect(() => {
    setWebhookUrl(school?.backupWebhookUrl || "");
  }, [school?.backupWebhookUrl]);

  // Live backup history
  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    const q = query(
      collection(db, "backups"),
      where("schoolId", "==", schoolId),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setBackups(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BackupRecord)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [schoolId]);

  const lastBackup = backups[0];

  async function handleExportNow() {
    setExporting(true);
    setMsg(null);
    try {
      await exportSchoolBackupSecure();
      setMsg({ type: "success", text: "Sauvegarde effectuée avec succès !" });
    } catch {
      setMsg({ type: "error", text: "Erreur lors de la sauvegarde. Réessayez." });
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadJson() {
    if (!schoolId) return;
    setDownloadingJson(true);
    try {
      const allData: Record<string, unknown[]> = { exportedAt: [new Date().toISOString()] as unknown[] };
      for (const coll of EXPORT_COLLECTIONS) {
        const snap = await getDocs(query(collection(db, coll), where("schoolId", "==", schoolId)));
        allData[coll] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const json = JSON.stringify({ schoolId, exportedAt: new Date().toISOString(), data: allData }, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `backup_${(school?.schoolName || "ecole").replace(/\s+/g, "_")}_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg({ type: "error", text: "Erreur lors du téléchargement JSON." });
    } finally {
      setDownloadingJson(false);
    }
  }

  async function handleDownloadPdf() {
    if (!schoolId) return;
    setDownloadingPdf(true);
    try {
      // Fetch summary stats
      const [elevesSnap, paiementsSnap, presencesSnap] = await Promise.all([
        getDocs(query(collection(db, "eleves"), where("schoolId", "==", schoolId))),
        getDocs(query(collection(db, "paiements"), where("schoolId", "==", schoolId))),
        getDocs(query(collection(db, "presences"), where("schoolId", "==", schoolId))),
      ]);

      const classCounts: Record<string, number> = {};
      elevesSnap.docs.forEach((d) => {
        const cl = d.data().classe || "Sans classe";
        classCounts[cl] = (classCounts[cl] || 0) + 1;
      });

      let totalDu = 0, totalPaye = 0, impaye = 0;
      paiementsSnap.docs.forEach((d) => {
        const p = d.data();
        totalDu += p.montantTotal || 0;
        totalPaye += p.montantPaye || 0;
        if (p.statut === "impaye") impaye++;
      });

      let present = 0, absent = 0;
      presencesSnap.docs.forEach((d) => {
        if (d.data().statut === "present") present++;
        else if (d.data().statut === "absent") absent++;
      });
      const tauxPresence = present + absent > 0
        ? Math.round((present / (present + absent)) * 100)
        : 100;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const printDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

      // Header
      doc.setFillColor(30, 80, 200);
      doc.rect(0, 0, W, 36, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text((school?.schoolName || "EduTrack").toUpperCase(), 14, 16);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("RAPPORT DE SAUVEGARDE — RÉSUMÉ DES DONNÉES", 14, 26);
      doc.setFontSize(9);
      doc.text(`Généré le ${printDate}`, W - 14, 26, { align: "right" });

      let y = 50;

      // Summary cards
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 80, 200);
      doc.text("DONNÉES GÉNÉRALES", 14, y); y += 6;

      const fmt = (n: number) =>
        n.toLocaleString("fr-FR").replace(/\u00A0|\u202F/g, " ") + " FCFA";

      autoTable(doc, {
        startY: y,
        body: [
          ["Total élèves", String(elevesSnap.size)],
          ["Total paiements", String(paiementsSnap.size)],
          ["Total présences", String(presencesSnap.size)],
          ["Taux de présence", `${tauxPresence}%`],
          ["Montant total dû", fmt(totalDu)],
          ["Montant collecté", fmt(totalPaye)],
          ["Paiements impayés", String(impaye)],
        ],
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 80 },
          1: { halign: "right" },
        },
        bodyStyles: { fontSize: 10, textColor: [20, 20, 30] },
        alternateRowStyles: { fillColor: [240, 244, 255] },
        margin: { left: 14, right: 14 },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

      // Class breakdown
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 80, 200);
      doc.text("RÉPARTITION PAR CLASSE", 14, y); y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Classe", "Nombre d'élèves"]],
        body: Object.entries(classCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([cl, n]) => [cl, String(n)]),
        headStyles: { fillColor: [30, 80, 200], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [20, 20, 30] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const H = doc.internal.pageSize.getHeight();
      doc.setFillColor(30, 80, 200);
      doc.rect(0, H - 10, W, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`${(school?.schoolName || "EduTrack").toUpperCase()} — Rapport généré par EduTrack le ${printDate}`, W / 2, H - 4, { align: "center" });

      const date = new Date().toISOString().slice(0, 10);
      doc.save(`rapport_sauvegarde_${(school?.schoolName || "ecole").replace(/\s+/g, "_")}_${date}.pdf`);
    } catch {
      setMsg({ type: "error", text: "Erreur lors de la génération du PDF." });
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleSaveWebhook() {
    if (!schoolId) return;
    setSavingWebhook(true);
    try {
      await updateDoc(doc(db, "schools", schoolId), { backupWebhookUrl: webhookUrl });
      setMsg({ type: "success", text: "URL webhook enregistrée." });
    } catch {
      setMsg({ type: "error", text: "Erreur lors de la sauvegarde." });
    } finally {
      setSavingWebhook(false);
    }
  }

  const cardStyle = {
    background: colors.bgCard,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: 20,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: "0 0 6px" }}>Sauvegardes</h1>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
            Protection et archivage automatique des données de l'établissement
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleDownloadJson}
            disabled={downloadingJson}
            style={{ padding: "10px 16px", background: colors.bgSecondary, border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: colors.text, cursor: downloadingJson ? "wait" : "pointer" }}
          >
            {downloadingJson ? "Préparation…" : "⬇ JSON"}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            style={{ padding: "10px 16px", background: colors.bgSecondary, border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: colors.text, cursor: downloadingPdf ? "wait" : "pointer" }}
          >
            {downloadingPdf ? "Génération…" : "⬇ PDF"}
          </button>
          <button
            onClick={handleExportNow}
            disabled={exporting}
            style={{ padding: "10px 20px", background: colors.primary, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#fff", cursor: exporting ? "wait" : "pointer" }}
          >
            {exporting ? "Sauvegarde en cours…" : "☁ Exporter maintenant"}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14,
          background: msg.type === "success" ? colors.successBg : colors.dangerBg,
          color: msg.type === "success" ? colors.success : colors.danger,
          border: `1px solid ${msg.type === "success" ? colors.success : colors.danger}40`,
        }}>
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 6px" }}>Dernière sauvegarde</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>
            {lastBackup?.timestamp
              ? lastBackup.timestamp.toDate().toLocaleDateString("fr-FR")
              : "—"}
          </p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 6px" }}>Docs dans la dernière sauvegarde</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>
            {lastBackup?.totalDocs?.toLocaleString("fr-FR") ?? "—"}
          </p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 6px" }}>Prochaine sauvegarde automatique</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: colors.primary, margin: 0 }}>
            Lundi 06h00 (WAT)
          </p>
        </div>
      </div>

      {/* Webhook config */}
      <div style={{ ...cardStyle, marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: "0 0 8px" }}>
          ⚙ Configuration — Envoi automatique (OneDrive / Google Drive)
        </h3>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 12px" }}>
          Collez l'URL de votre webhook Power Automate (OneDrive/SharePoint) ou Google Apps Script (Google Drive).
          La sauvegarde automatique hebdomadaire sera envoyée à cette adresse.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://prod-xx.westeurope.logic.azure.com/workflows/..."
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 13,
              border: `1px solid ${colors.border}`, background: colors.bgSecondary,
              color: colors.text, outline: "none",
            }}
          />
          <button
            onClick={handleSaveWebhook}
            disabled={savingWebhook}
            style={{ padding: "10px 18px", background: colors.primary, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {savingWebhook ? "…" : "Enregistrer"}
          </button>
        </div>

        {/* Instructions */}
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontSize: 13, color: colors.primary, cursor: "pointer", fontWeight: 600 }}>
            Comment configurer OneDrive (Power Automate) ?
          </summary>
          <ol style={{ fontSize: 12, color: colors.textMuted, marginTop: 8, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Ouvrir <strong>Power Automate</strong> → Créer un flux instantané</li>
            <li>Trigger : <em>"Lors de la réception d'une requête HTTP"</em></li>
            <li>Action : <em>"Créer un fichier"</em> → choisir votre dossier OneDrive</li>
            <li>Nom du fichier : <code>{"backup_@{triggerBody()?['exportedAt']}.json"}</code></li>
            <li>Contenu : <code>{"@{triggerBody()}"}</code></li>
            <li>Copier l'URL HTTP POST générée et la coller ci-dessus</li>
          </ol>
        </details>
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 13, color: colors.primary, cursor: "pointer", fontWeight: 600 }}>
            Comment configurer Google Drive (Apps Script) ?
          </summary>
          <ol style={{ fontSize: 12, color: colors.textMuted, marginTop: 8, paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Ouvrir Google Drive → Menu <em>Extensions → Apps Script</em></li>
            <li>Coller le code :</li>
            <pre style={{ background: colors.bgSecondary, padding: 8, borderRadius: 6, fontSize: 11, overflow: "auto" }}>{`function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var folder = DriveApp.getFolderById("VOTRE_FOLDER_ID");
  folder.createFile(
    "backup_" + data.exportedAt + ".json",
    e.postData.contents, "application/json"
  );
  return ContentService.createTextOutput("OK");
}`}</pre>
            <li>Déployer → Déploiement Web → Accès : Tout le monde</li>
            <li>Copier l'URL de déploiement et la coller ci-dessus</li>
          </ol>
        </details>
      </div>

      {/* Backup history */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>
          Historique des sauvegardes
        </h3>

        {loading ? (
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement…</p>
        ) : backups.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: 14, textAlign: "center", padding: "32px 0" }}>
            Aucune sauvegarde enregistrée. Cliquez sur "Exporter maintenant" pour créer la première.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: colors.bgSecondary }}>
                <tr>
                  {["Date & heure", "Total docs", "Webhook", "Déclenché par", "Collections"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {backups.map((b, i) => (
                  <tr key={b.id} style={{ borderTop: i > 0 ? `1px solid ${colors.borderLight}` : "none" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: colors.text }}>
                      {b.timestamp
                        ? b.timestamp.toDate().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: colors.text, fontWeight: 600 }}>
                      {b.totalDocs?.toLocaleString("fr-FR")}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>
                      {webhookUrl ? (
                        b.webhookSent
                          ? <span style={{ color: colors.success, fontWeight: 600 }}>✓ Envoyé</span>
                          : <span style={{ color: colors.danger }}>✗ Échec</span>
                      ) : <span style={{ color: colors.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: colors.textMuted }}>
                      {b.triggeredBy === "system_weekly" ? "Planifié (auto)" : "Manuel"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: colors.textMuted }}>
                      {b.collectionCounts
                        ? Object.entries(b.collectionCounts)
                          .filter(([, n]) => n > 0)
                          .map(([k, n]) => `${k}: ${n}`)
                          .join(" · ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
