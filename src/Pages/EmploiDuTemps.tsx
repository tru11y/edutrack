import { useEffect, useState, useCallback, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "../services/firebase";
import { useTenant } from "../context/TenantContext";
import { useTheme } from "../context/ThemeContext";
import { useToast, ConfirmModal } from "../components/ui";
import { getCreneaux, createCreneau, deleteCreneau } from "../modules/emploi-du-temps/emploi.service";
import { updateCreneauSecure } from "../services/cloudFunctions";
import { getAllProfesseurs } from "../modules/professeurs/professeur.service";
import { JOURS } from "../constants";
import type { Creneau } from "../modules/emploi-du-temps/emploi.types";
import type { Jour } from "../constants";
import type { Professeur } from "../modules/professeurs/professeur.types";

interface ClasseOption { id: string; nom: string; }
interface MatiereOption { id: string; nom: string; }

/** Compute side-by-side positions for overlapping creneaux in a single day column. */
function computeDayLayout(creneaux: Creneau[]): Map<string, { left: string; right: string }> {
  const result = new Map<string, { left: string; right: string }>();
  if (!creneaux.length) return result;
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const overlaps = (a: Creneau, b: Creneau) =>
    toMin(a.heureDebut) < toMin(b.heureFin) && toMin(b.heureDebut) < toMin(a.heureFin);

  // Find connected overlap clusters (transitively overlapping groups)
  const sorted = [...creneaux].sort((a, b) => toMin(a.heureDebut) - toMin(b.heureDebut));
  const visited = new Set<string>();
  const clusters: Creneau[][] = [];
  for (const c of sorted) {
    if (visited.has(c.id!)) continue;
    const cluster: Creneau[] = [];
    const queue = [c];
    while (queue.length) {
      const curr = queue.shift()!;
      if (visited.has(curr.id!)) continue;
      visited.add(curr.id!);
      cluster.push(curr);
      sorted.forEach(o => { if (!visited.has(o.id!) && overlaps(curr, o)) queue.push(o); });
    }
    clusters.push(cluster);
  }

  for (const cluster of clusters) {
    if (cluster.length === 1) { result.set(cluster[0].id!, { left: "2px", right: "2px" }); continue; }
    const clSorted = [...cluster].sort((a, b) => toMin(a.heureDebut) - toMin(b.heureDebut));
    const colEnds: number[] = [];
    const assign = new Map<string, number>();
    for (const c of clSorted) {
      const start = toMin(c.heureDebut);
      let i = colEnds.findIndex(e => e <= start);
      if (i === -1) i = colEnds.length;
      assign.set(c.id!, i);
      colEnds[i] = toMin(c.heureFin);
    }
    const n = colEnds.length;
    for (const c of cluster) {
      const idx = assign.get(c.id!)!;
      result.set(c.id!, {
        left: `calc(${(idx / n) * 100}% + 2px)`,
        right: `calc(${((n - idx - 1) / n) * 100}% + 2px)`,
      });
    }
  }
  return result;
}

const EMPTY_FORM = {
  jour: "lundi" as Jour,
  heureDebut: "",
  heureFin: "",
  classe: "",
  matiere: "",
  professeurId: "",
  type: "renforcement" as "renforcement" | "soir",
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h–19h
const MAT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4"];

export default function EmploiDuTemps() {
  const { colors } = useTheme();
  const toast = useToast();
  const { schoolId } = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [profs, setProfs] = useState<Professeur[]>([]);
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [matieres, setMatieres] = useState<MatiereOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters
  const [filterClasse, setFilterClasse] = useState<string>("");
  const todayIndex = new Date().getDay();
  const defaultJour = todayIndex === 0 ? JOURS[0] : JOURS[todayIndex - 1] || JOURS[0];
  const [filterJour, setFilterJour] = useState<Jour | "">(defaultJour);

  // Drag & drop state (creneaux on grid)
  const [draggedCreneau, setDraggedCreneau] = useState<Creneau | null>(null);
  const [dropTarget, setDropTarget] = useState<{ jour: Jour; hour: number } | null>(null);
  const [dragConflict, setDragConflict] = useState(false);
  const [showDragConfirm, setShowDragConfirm] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{ creneau: Creneau; jour: Jour; heureDebut: string; heureFin: string } | null>(null);

  // Import Excel state
  const [showImport, setShowImport] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Creneau>[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Confirm modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });

  // Color maps
  const matiereColorMap: Record<string, string> = {};
  matieres.forEach((m, i) => { matiereColorMap[m.nom] = MAT_COLORS[i % MAT_COLORS.length]; });

  const loadData = async () => {
    try {
      const [c, p, classesSnap, matieresSnap] = await Promise.all([
        getCreneaux(schoolId),
        getAllProfesseurs(schoolId),
        schoolId ? getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId))) : getDocs(collection(db, "classes")),
        schoolId ? getDocs(query(collection(db, "matieres"), where("schoolId", "==", schoolId))) : getDocs(collection(db, "matieres")),
      ]);
      setCreneaux(c);
      setProfs(p.filter((pr) => pr.statut !== "inactif"));
      setClasses(classesSnap.docs.map((d) => ({ id: d.id, nom: (d.data() as { nom: string }).nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
      setMatieres(matieresSnap.docs.map((d) => ({ id: d.id, nom: (d.data() as { nom: string }).nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (schoolId) loadData(); }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prof-matière link: matieres available for selected prof
  const selectedProf = profs.find((p) => p.id === form.professeurId);
  const profMatieres = selectedProf?.matieres?.length
    ? matieres.filter((m) => selectedProf.matieres.includes(m.nom))
    : matieres;

  // Matieres → profs filter: profs who teach the selected matiere
  const matiereProfsFiltres = form.matiere
    ? profs.filter((p) => !p.matieres?.length || p.matieres.includes(form.matiere))
    : profs;

  // Grid helpers
  const timeToMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const timeToPos = (time: string) => { const [h, m] = time.split(":").map(Number); return ((h - 7) + m / 60) * 60; };

  const checkDragConflicts = useCallback((jour: string, heureDebut: string, heureFin: string, excludeId?: string) => {
    const s1 = timeToMin(heureDebut), e1 = timeToMin(heureFin);
    return creneaux.some((c) => {
      if (c.id === excludeId || c.jour !== jour) return false;
      const s2 = timeToMin(c.heureDebut), e2 = timeToMin(c.heureFin);
      return s1 < e2 && s2 < e1 && (c.professeurId === draggedCreneau?.professeurId || c.classe === draggedCreneau?.classe);
    });
  }, [creneaux, draggedCreneau]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragStart = (e: React.DragEvent, creneau: Creneau) => {
    setDraggedCreneau(creneau);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, jour: Jour, hour: number) => {
    e.preventDefault();
    if (!draggedCreneau) return;
    setDropTarget({ jour, hour });
    const dur = timeToMin(draggedCreneau.heureFin) - timeToMin(draggedCreneau.heureDebut);
    const ns = `${String(hour).padStart(2, "0")}:00`;
    const endH = hour + Math.floor(dur / 60), endM = dur % 60;
    const ne = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    setDragConflict(checkDragConflicts(jour, ns, ne, draggedCreneau.id));
  };

  const executeDrop = async (creneau: Creneau, jour: Jour, heureDebut: string, heureFin: string) => {
    if (!creneau.id) return;
    try {
      const result = await updateCreneauSecure({ id: creneau.id, jour, heureDebut, heureFin });
      if (result.success) { toast.success("Créneau déplacé"); await loadData(); }
      else toast.error(result.message || "Conflit détecté");
    } catch { toast.error("Erreur lors du déplacement"); }
  };

  const handleDrop = async (e: React.DragEvent, jour: Jour, hour: number) => {
    e.preventDefault();
    if (!draggedCreneau?.id) return;
    const dur = timeToMin(draggedCreneau.heureFin) - timeToMin(draggedCreneau.heureDebut);
    const ns = `${String(hour).padStart(2, "0")}:00`;
    const endH = hour + Math.floor(dur / 60), endM = dur % 60;
    const ne = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    if (checkDragConflicts(jour, ns, ne, draggedCreneau.id)) {
      setPendingDrop({ creneau: draggedCreneau, jour, heureDebut: ns, heureFin: ne });
      setShowDragConfirm(true);
    } else {
      await executeDrop(draggedCreneau, jour, ns, ne);
    }
    setDraggedCreneau(null); setDropTarget(null); setDragConflict(false);
  };

  const handleDragEnd = () => { setDraggedCreneau(null); setDropTarget(null); setDragConflict(false); };

  const getProfNom = (profId: string) => {
    const p = profs.find((pr) => pr.id === profId);
    return p ? `${p.prenom} ${p.nom}`.trim() : "—";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.heureDebut || !form.heureFin || !form.classe || !form.matiere || !form.professeurId) {
      setError("Tous les champs sont requis."); return;
    }
    if (form.heureDebut >= form.heureFin) {
      setError("L'heure de fin doit être après l'heure de début."); return;
    }
    setError(""); setSaving(true);
    try {
      await createCreneau({ ...form, schoolId: schoolId || "" });
      setForm(EMPTY_FORM); setShowForm(false);
      await loadData();
      toast.success("Créneau créé");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally { setSaving(false); }
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true, title: "Supprimer le créneau", message: "Supprimer ce créneau ?", variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        try { await deleteCreneau(id); await loadData(); toast.success("Créneau supprimé"); }
        catch { toast.error("Erreur lors de la suppression"); }
      },
    });
  };

  // ── EXPORT PDF ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const classe = filterClasse || "Toutes les classes";
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(`Emploi du temps — ${classe}`, 14, 14);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 21);

    const rows = creneauxFiltres.map((c) => [
      c.jour.charAt(0).toUpperCase() + c.jour.slice(1),
      `${c.heureDebut} – ${c.heureFin}`,
      c.classe,
      c.matiere,
      getProfNom(c.professeurId),
      c.type === "soir" ? "Soir" : "Renforcement",
    ]);

    autoTable(doc, {
      startY: 26,
      head: [["Jour", "Horaire", "Classe", "Matière", "Professeur", "Type"]],
      body: rows,
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9 },
    });

    doc.save(`emploi_du_temps_${filterClasse || "all"}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exporté");
  };

  // ── EXPORT EXCEL ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    const rows = creneauxFiltres.map((c) => ({
      Jour: c.jour.charAt(0).toUpperCase() + c.jour.slice(1),
      "Heure début": c.heureDebut,
      "Heure fin": c.heureFin,
      Classe: c.classe,
      Matière: c.matiere,
      Professeur: getProfNom(c.professeurId),
      Type: c.type === "soir" ? "Cours du soir" : "Renforcement",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Emploi du temps");
    XLSX.writeFile(wb, `emploi_du_temps_${filterClasse || "all"}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel exporté");
  };

  // ── IMPORT EXCEL ──────────────────────────────────────────────────────────
  const parseExcelFile = (file: File) => {
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

        // Normaliser les colonnes (flexible)
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
        const parsed: Partial<Creneau>[] = rows.map((row) => {
          const keys = Object.keys(row);
          const get = (patterns: string[]) => {
            const k = keys.find((k) => patterns.some((p) => normalize(k).includes(p)));
            return k ? String(row[k]).trim() : "";
          };
          const jour = get(["jour", "day"]).toLowerCase() as Jour;
          const heureDebut = get(["debut", "start", "heure debut", "heuredebut"]);
          const heureFin = get(["fin", "end", "heure fin", "heurefin"]);
          const classe = get(["classe", "class", "groupe"]);
          const matiere = get(["matiere", "matière", "subject", "cours"]);
          const profRaw = get(["prof", "professeur", "teacher", "enseignant"]);
          // Try to match prof by name
          const profMatch = profs.find((p) => {
            const full = `${p.prenom} ${p.nom}`.toLowerCase();
            return full.includes(profRaw.toLowerCase()) || profRaw.toLowerCase().includes(p.nom.toLowerCase());
          });
          return { jour, heureDebut, heureFin, classe, matiere, professeurId: profMatch?.id || profRaw };
        }).filter((r) => r.jour && r.heureDebut && r.classe);

        setImportPreview(parsed);
      } catch {
        toast.error("Fichier Excel invalide ou colonnes non reconnues");
        setImportPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      parseExcelFile(file);
    } else {
      toast.error("Format accepté : .xlsx, .xls, .csv");
    }
  };

  const handleImportConfirm = async () => {
    if (!importPreview.length) return;
    setImporting(true);
    let ok = 0, fail = 0;
    for (const c of importPreview) {
      try {
        if (c.jour && c.heureDebut && c.heureFin && c.classe && c.matiere) {
          await createCreneau({ ...c as Required<typeof c>, schoolId: schoolId || "", type: (c.type as "renforcement" | "soir") || "renforcement" });
          ok++;
        } else { fail++; }
      } catch { fail++; }
    }
    setImporting(false);
    setImportPreview([]); setImportFile(null); setShowImport(false);
    await loadData();
    toast.success(`${ok} créneau(x) importé(s)${fail > 0 ? `, ${fail} ignoré(s)` : ""}`);
  };

  // Filtered creneaux
  const creneauxFiltres = creneaux
    .filter((c) => (!filterClasse || c.classe === filterClasse) && (!filterJour || c.jour === filterJour))
    .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

  const creneauxParJour = JOURS.reduce((acc, jour) => {
    acc[jour] = creneaux.filter((c) => c.jour === jour && (!filterClasse || c.classe === filterClasse));
    return acc;
  }, {} as Record<string, Creneau[]>);

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
    borderRadius: 8, fontSize: 14, background: colors.bgCard, color: colors.text, boxSizing: "border-box" as const,
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: colors.textMuted, fontSize: 14 }}>Chargement...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      {/* ── En-tête ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 }}>Emploi du temps</h1>
              <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>{creneaux.length} créneau{creneaux.length !== 1 ? "x" : ""} · {classes.length} classes</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* View toggle */}
            <div style={{ display: "flex", background: colors.bgSecondary, borderRadius: 8, padding: 3 }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: "8px 14px", background: viewMode === "grid" ? colors.bgCard : "transparent", color: viewMode === "grid" ? colors.text : colors.textMuted, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Grille</button>
              <button onClick={() => setViewMode("list")} style={{ padding: "8px 14px", background: viewMode === "list" ? colors.bgCard : "transparent", color: viewMode === "list" ? colors.text : colors.textMuted, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Liste</button>
            </div>
            {/* Export */}
            <button onClick={exportExcel} style={{ padding: "9px 14px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12 9.5V12.5H3V9.5M7.5 1.5V9.5M4.5 6.5L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Excel
            </button>
            <button onClick={exportPDF} style={{ padding: "9px 14px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12 9.5V12.5H3V9.5M7.5 1.5V9.5M4.5 6.5L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>PDF
            </button>
            {/* Import */}
            <button onClick={() => setShowImport(!showImport)} style={{ padding: "9px 14px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M12 5.5V2.5H3V5.5M7.5 13.5V5.5M4.5 8.5L7.5 5.5L10.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Importer
            </button>
            <button onClick={() => { setShowForm(!showForm); setError(""); }} style={{ padding: "9px 16px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {showForm ? "Annuler" : "+ Créneau"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
          style={{ padding: "9px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, background: colors.bgCard, color: colors.text, minWidth: 160 }}
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
        </select>
        {viewMode === "list" && (
          <div style={{ display: "flex", gap: 4, background: colors.bgSecondary, borderRadius: 8, padding: 3, overflowX: "auto" }}>
            <button onClick={() => setFilterJour("")} style={{ padding: "8px 14px", background: !filterJour ? colors.bgCard : "transparent", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, color: !filterJour ? colors.text : colors.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>Tous</button>
            {JOURS.map((j) => (
              <button key={j} onClick={() => setFilterJour(j)} style={{ padding: "8px 14px", background: filterJour === j ? colors.bgCard : "transparent", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, color: filterJour === j ? colors.text : colors.textMuted, cursor: "pointer", whiteSpace: "nowrap", textTransform: "capitalize" }}>{j}</button>
            ))}
          </div>
        )}
        {filterClasse && (
          <span style={{ padding: "9px 14px", background: colors.primaryBg, color: colors.primary, borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
            📋 {filterClasse}
          </span>
        )}
      </div>

      {/* ── Import zone ── */}
      {showImport && (
        <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: colors.text }}>Importer depuis Excel</h3>
            <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Colonnes attendues : Jour, Heure début, Heure fin, Classe, Matière, Professeur</p>
          </div>
          {/* Drag & Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleImportDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? colors.primary : colors.border}`,
              borderRadius: 10, padding: 32, textAlign: "center", cursor: "pointer",
              background: dragOver ? colors.primaryBg : colors.bgSecondary,
              transition: "all 0.2s", marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <p style={{ fontSize: 14, color: colors.text, margin: "0 0 4px", fontWeight: 500 }}>
              {importFile ? importFile.name : "Glissez votre fichier Excel ici"}
            </p>
            <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>ou cliquez pour choisir un fichier (.xlsx, .xls, .csv)</p>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) parseExcelFile(f); }} />
          </div>

          {/* Preview */}
          {importPreview.length > 0 && (
            <div>
              <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>{importPreview.length} créneau(x) détecté(s) :</p>
              <div style={{ maxHeight: 200, overflowY: "auto", borderRadius: 8, border: `1px solid ${colors.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead style={{ background: colors.bgSecondary, position: "sticky", top: 0 }}>
                    <tr>
                      {["Jour", "Horaire", "Classe", "Matière", "Professeur"].map((h) => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: colors.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((r, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${colors.border}` }}>
                        <td style={{ padding: "7px 12px", color: colors.text, textTransform: "capitalize" }}>{r.jour}</td>
                        <td style={{ padding: "7px 12px", color: colors.text }}>{r.heureDebut} – {r.heureFin}</td>
                        <td style={{ padding: "7px 12px", color: colors.text }}>{r.classe}</td>
                        <td style={{ padding: "7px 12px", color: colors.text }}>{r.matiere}</td>
                        <td style={{ padding: "7px 12px", color: colors.text }}>{typeof r.professeurId === "string" && r.professeurId.length > 20 ? getProfNom(r.professeurId) : r.professeurId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={handleImportConfirm} disabled={importing} style={{ padding: "9px 20px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.7 : 1 }}>
                  {importing ? "Import en cours..." : `Importer ${importPreview.length} créneau(x)`}
                </button>
                <button onClick={() => { setImportPreview([]); setImportFile(null); }} style={{ padding: "9px 16px", background: colors.bgSecondary, color: colors.textMuted, border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Formulaire création ── */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: colors.text }}>Nouveau créneau</h3>
          {error && (
            <div style={{ padding: "10px 14px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 8, marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: colors.danger, margin: 0 }}>{error}</p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Jour *</label>
              <select value={form.jour} onChange={(e) => setForm({ ...form, jour: e.target.value as Jour })} style={inputStyle}>
                {JOURS.map((j) => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Heure début *</label>
              <input type="time" value={form.heureDebut} onChange={(e) => setForm({ ...form, heureDebut: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Heure fin *</label>
              <input type="time" value={form.heureFin} onChange={(e) => setForm({ ...form, heureFin: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Classe *</label>
              <select value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} required style={inputStyle}>
                <option value="">— Choisir —</option>
                {classes.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>
                Matière * {form.professeurId && selectedProf?.matieres?.length ? `(${profMatieres.length} du prof)` : ""}
              </label>
              <select
                value={form.matiere}
                onChange={(e) => setForm({ ...form, matiere: e.target.value, professeurId: "" })}
                required style={inputStyle}
              >
                <option value="">— Choisir —</option>
                {profMatieres.map((m) => <option key={m.id} value={m.nom}>{m.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>
                Professeur * {form.matiere ? `(${matiereProfsFiltres.length} disponibles)` : ""}
              </label>
              <select
                value={form.professeurId}
                onChange={(e) => setForm({ ...form, professeurId: e.target.value })}
                required style={inputStyle}
              >
                <option value="">— Choisir —</option>
                {matiereProfsFiltres.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} {p.nom}{p.matieres?.length ? ` (${p.matieres.slice(0, 2).join(", ")})` : ""}
                  </option>
                ))}
              </select>
              {profs.length === 0 && (
                <p style={{ fontSize: 11, color: colors.danger, margin: "4px 0 0" }}>Aucun professeur trouvé. Vérifiez que des professeurs sont créés.</p>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "renforcement" | "soir" })} style={inputStyle}>
                <option value="renforcement">Renforcement</option>
                <option value="soir">Cours du soir</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: colors.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Enregistrement..." : "Enregistrer le créneau"}
          </button>
        </form>
      )}

      {/* ── Vue Grille ── */}
      {viewMode === "grid" && (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${JOURS.length}, 1fr)`, minWidth: 800 }}>
            {/* Header */}
            <div style={{ padding: "12px 8px", borderBottom: `1px solid ${colors.border}`, background: colors.bgSecondary }} />
            {JOURS.map((j) => (
              <div key={j} style={{ padding: "12px 8px", borderBottom: `1px solid ${colors.border}`, borderLeft: `1px solid ${colors.border}`, background: colors.bgSecondary, textAlign: "center", fontSize: 13, fontWeight: 600, color: colors.text, textTransform: "capitalize" }}>{j}</div>
            ))}
            {/* Heures */}
            <div style={{ position: "relative" }}>
              {HOURS.map((h) => (
                <div key={h} style={{ height: 60, padding: "0 8px", display: "flex", alignItems: "flex-start", justifyContent: "center", borderBottom: `1px solid ${colors.border}`, fontSize: 11, color: colors.textMuted, paddingTop: 3 }}>{h}:00</div>
              ))}
            </div>
            {/* Colonnes jours */}
            {JOURS.map((jour) => {
              const dayLayout = computeDayLayout(creneauxParJour[jour]);
              return (
              <div key={jour} style={{ position: "relative", borderLeft: `1px solid ${colors.border}` }}>
                {HOURS.map((h) => (
                  <div key={h}
                    style={{ height: 60, borderBottom: `1px solid ${colors.border}`, background: dropTarget?.jour === jour && dropTarget?.hour === h ? (dragConflict ? `${colors.danger}20` : `${colors.primary}15`) : "transparent", transition: "background 0.15s" }}
                    onDragOver={(e) => handleDragOver(e, jour, h)}
                    onDrop={(e) => handleDrop(e, jour, h)}
                  />
                ))}
                {creneauxParJour[jour].map((c) => {
                  const top = timeToPos(c.heureDebut);
                  const height = Math.max(timeToPos(c.heureFin) - top, 22);
                  const mColor = matiereColorMap[c.matiere] || colors.primary;
                  const isDragging = draggedCreneau?.id === c.id;
                  const pos = dayLayout.get(c.id!) ?? { left: "2px", right: "2px" };
                  return (
                    <div key={c.id} draggable onDragStart={(e) => handleDragStart(e, c)} onDragEnd={handleDragEnd}
                      style={{ position: "absolute", top, left: pos.left, right: pos.right, height, background: `${mColor}20`, borderLeft: `3px solid ${mColor}`, borderRadius: 6, padding: "3px 5px", overflow: "hidden", cursor: "grab", fontSize: 10, lineHeight: 1.3, opacity: isDragging ? 0.4 : 1, transition: "opacity 0.2s" }}
                      title={`${c.matiere} · ${c.classe}\n${c.heureDebut}–${c.heureFin}\n${getProfNom(c.professeurId)}\n(Glisser pour déplacer)`}
                    >
                      <div style={{ fontWeight: 700, color: mColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.matiere}</div>
                      {height > 28 && <div style={{ color: colors.textMuted, fontSize: 9 }}>{c.classe}</div>}
                      {height > 40 && <div style={{ color: colors.textMuted, fontSize: 9 }}>{getProfNom(c.professeurId)}</div>}
                      {height > 52 && <div style={{ color: colors.textMuted, fontSize: 9 }}>{c.heureDebut}–{c.heureFin}</div>}
                      {height > 40 && (
                        <button onClick={(e) => { e.stopPropagation(); c.id && handleDelete(c.id); }}
                          style={{ position: "absolute", top: 2, right: 2, background: "none", border: "none", color: colors.danger, fontSize: 10, cursor: "pointer", padding: 1, lineHeight: 1 }}
                          title="Supprimer">✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Vue Liste ── */}
      {viewMode === "list" && (
        creneauxFiltres.length === 0 ? (
          <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
            <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun créneau{filterClasse ? ` pour ${filterClasse}` : ""}
            </p>
          </div>
        ) : (
          <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ background: colors.bgSecondary }}>
                    {["Jour", "Horaire", "Classe", "Matière", "Professeur", "Type", ""].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creneauxFiltres.map((c) => {
                    const mColor = matiereColorMap[c.matiere] || colors.primary;
                    return (
                      <tr key={c.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                        <td style={{ padding: "13px 16px", fontWeight: 500, color: colors.text, fontSize: 14, textTransform: "capitalize" }}>{c.jour}</td>
                        <td style={{ padding: "13px 16px", color: colors.textMuted, fontSize: 14 }}>{c.heureDebut} – {c.heureFin}</td>
                        <td style={{ padding: "13px 16px", fontSize: 14 }}>
                          <span style={{ padding: "3px 10px", background: colors.infoBg, color: colors.info, borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{c.classe}</span>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 14 }}>
                          <span style={{ padding: "3px 10px", background: `${mColor}18`, color: mColor, borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{c.matiere}</span>
                        </td>
                        <td style={{ padding: "13px 16px", color: colors.text, fontSize: 14 }}>{getProfNom(c.professeurId)}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: c.type === "soir" ? colors.primaryBg : colors.warningBg, color: c.type === "soir" ? colors.primary : colors.warning }}>
                            {c.type === "soir" ? "Soir" : "Renforcement"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", textAlign: "right" }}>
                          <button onClick={() => c.id && handleDelete(c.id)} style={{ padding: "5px 12px", background: colors.dangerBg, border: "none", borderRadius: 6, fontSize: 12, color: colors.danger, cursor: "pointer" }}>Supprimer</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Modales ── */}
      <ConfirmModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} variant={confirmState.variant} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState((s) => ({ ...s, isOpen: false }))} />
      <ConfirmModal
        isOpen={showDragConfirm} title="Conflit détecté" variant="warning"
        message="Un conflit a été détecté (même prof ou même classe). Déplacer quand même ?"
        onConfirm={async () => { setShowDragConfirm(false); if (pendingDrop) { await executeDrop(pendingDrop.creneau, pendingDrop.jour, pendingDrop.heureDebut, pendingDrop.heureFin); setPendingDrop(null); } }}
        onCancel={() => { setShowDragConfirm(false); setPendingDrop(null); }}
      />
    </div>
  );
}
