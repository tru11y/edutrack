import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
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

interface ClasseOption {
  id: string;
  nom: string;
}

interface MatiereOption {
  id: string;
  nom: string;
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

export default function EmploiDuTemps() {
  const { colors } = useTheme();
  const toast = useToast();
  const { schoolId } = useTenant();
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [profs, setProfs] = useState<Professeur[]>([]);
  const [classes, setClasses] = useState<ClasseOption[]>([]);
  const [matieres, setMatieres] = useState<MatiereOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Drag & Drop state
  const [draggedCreneau, setDraggedCreneau] = useState<Creneau | null>(null);
  const [dropTarget, setDropTarget] = useState<{ jour: Jour; hour: number } | null>(null);
  const [dragConflict, setDragConflict] = useState(false);
  const [showDragConfirm, setShowDragConfirm] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{ creneau: Creneau; jour: Jour; heureDebut: string; heureFin: string } | null>(null);

  // Matiere color map
  const matiereColorMap: Record<string, string> = {};
  matieres.forEach((m, i) => {
    const matColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6"];
    matiereColorMap[m.nom] = matColors[i % matColors.length];
  });

  const checkDragConflicts = useCallback((jour: string, heureDebut: string, heureFin: string, excludeId?: string) => {
    const timeToMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const s1 = timeToMin(heureDebut), e1 = timeToMin(heureFin);
    return creneaux.some((c) => {
      if (c.id === excludeId || c.jour !== jour) return false;
      const s2 = timeToMin(c.heureDebut), e2 = timeToMin(c.heureFin);
      return s1 < e2 && s2 < e1 && (c.professeurId === draggedCreneau?.professeurId || c.classe === draggedCreneau?.classe);
    });
  }, [creneaux, draggedCreneau]);

  const handleDragStart = (e: React.DragEvent, creneau: Creneau) => {
    setDraggedCreneau(creneau);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, jour: Jour, hour: number) => {
    e.preventDefault();
    if (!draggedCreneau) return;
    setDropTarget({ jour, hour });
    const duration = (() => {
      const [h1, m1] = draggedCreneau.heureDebut.split(":").map(Number);
      const [h2, m2] = draggedCreneau.heureFin.split(":").map(Number);
      return (h2 * 60 + m2) - (h1 * 60 + m1);
    })();
    const newStart = `${String(hour).padStart(2, "0")}:00`;
    const endH = hour + Math.floor(duration / 60);
    const endM = duration % 60;
    const newEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    setDragConflict(checkDragConflicts(jour, newStart, newEnd, draggedCreneau.id));
  };

  const handleDrop = async (e: React.DragEvent, jour: Jour, hour: number) => {
    e.preventDefault();
    if (!draggedCreneau?.id) return;
    const duration = (() => {
      const [h1, m1] = draggedCreneau.heureDebut.split(":").map(Number);
      const [h2, m2] = draggedCreneau.heureFin.split(":").map(Number);
      return (h2 * 60 + m2) - (h1 * 60 + m1);
    })();
    const newStart = `${String(hour).padStart(2, "0")}:00`;
    const endH = hour + Math.floor(duration / 60);
    const endM = duration % 60;
    const newEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    if (checkDragConflicts(jour, newStart, newEnd, draggedCreneau.id)) {
      setPendingDrop({ creneau: draggedCreneau, jour, heureDebut: newStart, heureFin: newEnd });
      setShowDragConfirm(true);
    } else {
      await executeDrop(draggedCreneau, jour, newStart, newEnd);
    }
    setDraggedCreneau(null);
    setDropTarget(null);
    setDragConflict(false);
  };

  const executeDrop = async (creneau: Creneau, jour: Jour, heureDebut: string, heureFin: string) => {
    if (!creneau.id) return;
    try {
      const result = await updateCreneauSecure({ id: creneau.id, jour, heureDebut, heureFin });
      if (result.success) {
        toast.success("Creneau deplace");
        await loadData();
      } else {
        toast.error(result.message || "Conflit detecte");
      }
    } catch {
      toast.error("Erreur lors du deplacement");
    }
  };

  const handleDragEnd = () => {
    setDraggedCreneau(null);
    setDropTarget(null);
    setDragConflict(false);
  };

  // Filtre par jour - par defaut le jour actuel
  const todayIndex = new Date().getDay();
  const defaultJour = todayIndex === 0 ? JOURS[0] : JOURS[todayIndex - 1] || JOURS[0];
  const [filterJour, setFilterJour] = useState<Jour | "">(defaultJour);

  const loadData = async () => {
    try {
      const [c, p, classesSnap, matieresSnap] = await Promise.all([
        getCreneaux(schoolId),
        getAllProfesseurs(schoolId),
        schoolId ? getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId))) : getDocs(collection(db, "classes")),
        schoolId ? getDocs(query(collection(db, "matieres"), where("schoolId", "==", schoolId))) : getDocs(collection(db, "matieres")),
      ]);
      setCreneaux(c);
      setProfs(p.filter((pr) => pr.statut === "actif"));
      setClasses(classesSnap.docs.map((d) => ({ id: d.id, nom: (d.data() as { nom: string }).nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
      setMatieres(matieresSnap.docs.map((d) => ({ id: d.id, nom: (d.data() as { nom: string }).nom })).sort((a, b) => a.nom.localeCompare(b.nom)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (schoolId) loadData(); }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.heureDebut || !form.heureFin || !form.classe || !form.matiere || !form.professeurId) {
      setError("Tous les champs sont requis.");
      return;
    }
    if (form.heureDebut >= form.heureFin) {
      setError("L'heure de fin doit etre apres l'heure de debut.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createCreneau({ ...form, schoolId: schoolId || "" });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la creation.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true, title: "Supprimer le creneau", message: "Supprimer ce creneau ?", variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        try {
          await deleteCreneau(id);
          await loadData();
          toast.success("Creneau supprime");
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors de la suppression");
        }
      },
    });
  };

  const getProfNom = (profId: string): string => {
    const prof = profs.find((p) => p.id === profId);
    return prof ? `${prof.prenom} ${prof.nom}` : profId;
  };

  const filtered = creneaux
    .filter((c) => !filterJour || c.jour === filterJour)
    .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

  const inputStyle = {
    width: "100%", padding: "10px 14px", border: `1px solid ${colors.border}`,
    borderRadius: 8, fontSize: 14, background: colors.bgCard, color: colors.text, boxSizing: "border-box" as const,
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Emploi du temps</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{creneaux.length} creneau{creneaux.length > 1 ? "x" : ""}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", background: colors.bgSecondary, borderRadius: 8, padding: 3 }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: "8px 14px", background: viewMode === "grid" ? colors.bgCard : "transparent", color: viewMode === "grid" ? colors.text : colors.textMuted, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Grille</button>
              <button onClick={() => setViewMode("list")} style={{ padding: "8px 14px", background: viewMode === "list" ? colors.bgCard : "transparent", color: viewMode === "list" ? colors.text : colors.textMuted, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Liste</button>
            </div>
            <button onClick={() => setShowForm(!showForm)} style={{ padding: "12px 20px", background: colors.primary, color: colors.bgCard, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              {showForm ? "Annuler" : "+ Creneau"}
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
          {error && (
            <div style={{ padding: "10px 14px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 8, marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: colors.danger, margin: 0 }}>{error}</p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Jour</label>
              <select value={form.jour} onChange={(e) => setForm({ ...form, jour: e.target.value as Jour })} style={inputStyle}>
                {JOURS.map((j) => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Debut</label>
              <input type="time" value={form.heureDebut} onChange={(e) => setForm({ ...form, heureDebut: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Fin</label>
              <input type="time" value={form.heureFin} onChange={(e) => setForm({ ...form, heureFin: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Classe</label>
              <select value={form.classe} onChange={(e) => setForm({ ...form, classe: e.target.value })} required style={inputStyle}>
                <option value="">Choisir une classe</option>
                {classes.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Matiere</label>
              <select value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })} required style={inputStyle}>
                <option value="">Choisir une matiere</option>
                {matieres.map((m) => <option key={m.id} value={m.nom}>{m.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Professeur</label>
              <select value={form.professeurId} onChange={(e) => setForm({ ...form, professeurId: e.target.value })} required style={inputStyle}>
                <option value="">Choisir un professeur</option>
                {profs.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "renforcement" | "soir" })} style={inputStyle}>
                <option value="renforcement">Renforcement</option>
                <option value="soir">Cours du soir</option>
              </select>
            </div>
            <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: colors.primary, color: colors.bgCard, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, marginTop: 20 }}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {viewMode === "list" && (
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: colors.bgSecondary, borderRadius: 12, padding: 4, overflowX: "auto" }}>
          <button onClick={() => setFilterJour("")} style={{ padding: "10px 16px", background: !filterJour ? colors.bgCard : "transparent", border: !filterJour ? `1px solid ${colors.border}` : "1px solid transparent", borderRadius: 8, fontSize: 13, fontWeight: 500, color: !filterJour ? colors.text : colors.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>
            Tous
          </button>
          {JOURS.map((j) => (
            <button key={j} onClick={() => setFilterJour(j)} style={{ padding: "10px 16px", background: filterJour === j ? colors.bgCard : "transparent", border: filterJour === j ? `1px solid ${colors.border}` : "1px solid transparent", borderRadius: 8, fontSize: 13, fontWeight: 500, color: filterJour === j ? colors.text : colors.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>
              {j.charAt(0).toUpperCase() + j.slice(1)}
            </button>
          ))}
        </div>
      )}

      {viewMode === "grid" ? (
        /* Grid view */
        (() => {
          const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h to 19h
          const creneauxByJour = JOURS.reduce((acc, jour) => {
            acc[jour] = creneaux.filter((c) => c.jour === jour).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
            return acc;
          }, {} as Record<string, Creneau[]>);

          const timeToPos = (time: string) => {
            const [h, m] = time.split(":").map(Number);
            return ((h - 7) + m / 60) * 60; // 60px per hour
          };

          const gridColors = [
            { bg: colors.primaryBg, border: colors.primary },
            { bg: colors.successBg, border: colors.success },
            { bg: colors.warningBg, border: colors.warning },
            { bg: colors.infoBg, border: colors.info },
            { bg: colors.dangerBg, border: colors.danger },
          ];
          const classeColorMap: Record<string, number> = {};
          let colorIdx = 0;
          creneaux.forEach((c) => {
            if (!(c.classe in classeColorMap)) {
              classeColorMap[c.classe] = colorIdx++ % gridColors.length;
            }
          });

          return (
            <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${JOURS.length}, 1fr)`, minWidth: 800 }}>
                {/* Header */}
                <div style={{ padding: "12px 8px", borderBottom: `1px solid ${colors.border}`, background: colors.bgSecondary }} />
                {JOURS.map((j) => (
                  <div key={j} style={{ padding: "12px 8px", borderBottom: `1px solid ${colors.border}`, borderLeft: `1px solid ${colors.border}`, background: colors.bgSecondary, textAlign: "center", fontSize: 13, fontWeight: 600, color: colors.text, textTransform: "capitalize" }}>
                    {j}
                  </div>
                ))}

                {/* Time rows */}
                <div style={{ position: "relative" }}>
                  {HOURS.map((h) => (
                    <div key={h} style={{ height: 60, padding: "0 8px", display: "flex", alignItems: "flex-start", justifyContent: "center", borderBottom: `1px solid ${colors.border}`, fontSize: 11, color: colors.textMuted, paddingTop: 2 }}>
                      {h}:00
                    </div>
                  ))}
                </div>

                {/* Day columns with drag & drop */}
                {JOURS.map((jour) => (
                  <div key={jour} style={{ position: "relative", borderLeft: `1px solid ${colors.border}` }}>
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        style={{
                          height: 60, borderBottom: `1px solid ${colors.border}`,
                          background: dropTarget?.jour === jour && dropTarget?.hour === h
                            ? (dragConflict ? `${colors.danger}20` : `${colors.primary}15`)
                            : "transparent",
                          transition: "background 0.15s",
                        }}
                        onDragOver={(e) => handleDragOver(e, jour, h)}
                        onDrop={(e) => handleDrop(e, jour, h)}
                      />
                    ))}
                    {/* Creneaux overlay */}
                    {creneauxByJour[jour].map((c) => {
                      const top = timeToPos(c.heureDebut);
                      const height = timeToPos(c.heureFin) - top;
                      const mColor = matiereColorMap[c.matiere] || colors.primary;
                      const isDragging = draggedCreneau?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, c)}
                          onDragEnd={handleDragEnd}
                          style={{
                            position: "absolute", top, left: 2, right: 2,
                            height: Math.max(height, 20),
                            background: `${mColor}18`, borderLeft: `3px solid ${mColor}`,
                            borderRadius: 6, padding: "4px 6px", overflow: "hidden",
                            cursor: "grab", fontSize: 11, lineHeight: 1.3,
                            opacity: isDragging ? 0.4 : 1,
                            transition: "opacity 0.2s",
                          }}
                          title={`${c.matiere} - ${c.classe}\n${c.heureDebut}-${c.heureFin}\n${getProfNom(c.professeurId)}\n(Glisser pour deplacer)`}
                        >
                          <div style={{ fontWeight: 600, color: mColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.matiere}</div>
                          {height > 30 && <div style={{ color: colors.textMuted, fontSize: 10 }}>{c.classe}</div>}
                          {height > 45 && <div style={{ color: colors.textMuted, fontSize: 10 }}>{c.heureDebut}-{c.heureFin}</div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })()
      ) : filtered.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucun creneau{filterJour ? ` pour ${filterJour}` : ""}</p>
        </div>
      ) : (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                {["Jour", "Horaire", "Classe", "Matiere", "Professeur", "Type", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14, textTransform: "capitalize" }}>{c.jour}</td>
                  <td style={{ padding: "14px 20px", color: colors.textMuted, fontSize: 14 }}>{c.heureDebut} - {c.heureFin}</td>
                  <td style={{ padding: "14px 20px", fontWeight: 500, color: colors.text, fontSize: 14 }}>{c.classe}</td>
                  <td style={{ padding: "14px 20px", color: colors.text, fontSize: 14, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.matiere}</td>
                  <td style={{ padding: "14px 20px", color: colors.text, fontSize: 14, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getProfNom(c.professeurId)}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: c.type === "soir" ? colors.primaryBg : colors.infoBg, color: c.type === "soir" ? colors.primary : colors.info }}>
                      {c.type === "soir" ? "Soir" : "Renforcement"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <button onClick={() => c.id && handleDelete(c.id)} style={{ padding: "6px 12px", background: colors.dangerBg, border: `1px solid ${colors.danger}40`, borderRadius: 6, fontSize: 12, color: colors.danger, cursor: "pointer" }}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Drag conflict confirmation */}
      <ConfirmModal
        isOpen={showDragConfirm}
        title="Conflit detecte"
        message="Un conflit a ete detecte (meme prof ou meme classe). Voulez-vous quand meme deplacer ce creneau ?"
        variant="warning"
        onConfirm={async () => {
          setShowDragConfirm(false);
          if (pendingDrop) {
            await executeDrop(pendingDrop.creneau, pendingDrop.jour, pendingDrop.heureDebut, pendingDrop.heureFin);
            setPendingDrop(null);
          }
        }}
        onCancel={() => { setShowDragConfirm(false); setPendingDrop(null); }}
      />
    </div>
  );
}
