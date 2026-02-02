import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getAllEleves } from "../modules/eleves/eleve.service";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import type { Eleve } from "../modules/eleves/eleve.types";

interface ScheduleSlot {
  jour: "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi";
  heureDebut: string;
  heureFin: string;
  matiere: string;
  profId?: string;
  profNom?: string;
}

interface ClasseData {
  id?: string;
  nom: string;
  niveau?: string;
  description?: string;
  emploiDuTemps?: ScheduleSlot[];
}

interface Matiere {
  id?: string;
  nom: string;
  description?: string;
  couleur?: string;
}

export default function Classes() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "gestionnaire";
  const [classes, setClasses] = useState<ClasseData[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newClasse, setNewClasse] = useState({ nom: "", niveau: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Emploi du temps state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState<ClasseData | null>(null);
  const [newSlot, setNewSlot] = useState<ScheduleSlot>({
    jour: "lundi",
    heureDebut: "08:00",
    heureFin: "09:00",
    matiere: "",
    profNom: ""
  });

  // Matieres state
  const [showMatieresModal, setShowMatieresModal] = useState(false);
  const [newMatiere, setNewMatiere] = useState({ nom: "", description: "" });
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null);

  const jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;

  const loadData = async () => {
    try {
      // Charger les classes depuis Firestore
      const classesSnap = await getDocs(collection(db, "classes"));
      const classesData = classesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClasseData[];

      // Charger les matieres
      const matieresSnap = await getDocs(collection(db, "matieres"));
      const matieresData = matieresSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Matiere[];
      setMatieres(matieresData.sort((a, b) => a.nom.localeCompare(b.nom)));

      // Charger les eleves
      const elevesData = await getAllEleves();
      setEleves(elevesData);

      // Extraire les classes des eleves qui n'existent pas encore
      const elevesClasses = [...new Set(elevesData.map((e) => e.classe).filter(Boolean))];
      const existingClassNames = classesData.map((c) => c.nom);

      // Ajouter les classes des eleves qui ne sont pas dans la collection
      const allClasses = [...classesData];
      for (const className of elevesClasses) {
        if (!existingClassNames.includes(className)) {
          allClasses.push({ nom: className });
        }
      }

      // Trier par nom
      allClasses.sort((a, b) => a.nom.localeCompare(b.nom));
      setClasses(allClasses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getElevesCount = (className: string) => {
    return eleves.filter((e) => e.classe === className).length;
  };

  const getElevesByGender = (className: string) => {
    const classEleves = eleves.filter((e) => e.classe === className);
    return {
      garcons: classEleves.filter((e) => e.sexe === "M").length,
      filles: classEleves.filter((e) => e.sexe === "F").length,
    };
  };

  const handleAddClasse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClasse.nom.trim()) return;

    // Verifier si la classe existe deja
    if (classes.some((c) => c.nom.toLowerCase() === newClasse.nom.trim().toLowerCase())) {
      alert("Cette classe existe deja");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "classes"), {
        nom: newClasse.nom.trim(),
        niveau: newClasse.niveau.trim() || null,
        description: newClasse.description.trim() || null,
      });
      setNewClasse({ nom: "", niveau: "", description: "" });
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClasse = async (classe: ClasseData) => {
    const count = getElevesCount(classe.nom);
    if (count > 0) {
      alert(`Impossible de supprimer: ${count} eleve(s) dans cette classe`);
      return;
    }

    if (!classe.id) {
      alert("Cette classe n'est pas enregistree dans la base");
      return;
    }

    if (!window.confirm(`Supprimer la classe "${classe.nom}" ?`)) return;

    try {
      await deleteDoc(doc(db, "classes", classe.id));
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  // Gestion de l'emploi du temps
  const openScheduleModal = (classe: ClasseData) => {
    setSelectedClasse(classe);
    setShowScheduleModal(true);
  };

  const handleAddSlot = async () => {
    if (!selectedClasse?.id || !newSlot.matiere.trim()) return;

    try {
      const currentSchedule = selectedClasse.emploiDuTemps || [];
      const updatedSchedule = [...currentSchedule, { ...newSlot, matiere: newSlot.matiere.trim(), profNom: newSlot.profNom?.trim() || "" }];

      await updateDoc(doc(db, "classes", selectedClasse.id), {
        emploiDuTemps: updatedSchedule
      });

      setNewSlot({ jour: "lundi", heureDebut: "08:00", heureFin: "09:00", matiere: "", profNom: "" });
      await loadData();
      // Update selectedClasse with new data
      setSelectedClasse(prev => prev ? { ...prev, emploiDuTemps: updatedSchedule } : null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout du cours");
    }
  };

  const handleRemoveSlot = async (index: number) => {
    if (!selectedClasse?.id) return;

    try {
      const currentSchedule = selectedClasse.emploiDuTemps || [];
      const updatedSchedule = currentSchedule.filter((_, i) => i !== index);

      await updateDoc(doc(db, "classes", selectedClasse.id), {
        emploiDuTemps: updatedSchedule
      });

      await loadData();
      setSelectedClasse(prev => prev ? { ...prev, emploiDuTemps: updatedSchedule } : null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression du cours");
    }
  };

  // Obtenir les cours d'aujourd'hui pour une classe
  const getTodaysCourses = (classe: ClasseData): ScheduleSlot[] => {
    if (!classe.emploiDuTemps) return [];
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long" }).toLowerCase();
    return classe.emploiDuTemps.filter(slot => slot.jour === today);
  };

  // Gestion des matieres
  const handleAddMatiere = async () => {
    if (!newMatiere.nom.trim()) return;

    try {
      await addDoc(collection(db, "matieres"), {
        nom: newMatiere.nom.trim(),
        description: newMatiere.description?.trim() || "",
      });
      setNewMatiere({ nom: "", description: "" });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout de la matiere");
    }
  };

  const handleUpdateMatiere = async () => {
    if (!editingMatiere?.id || !editingMatiere.nom.trim()) return;

    try {
      await updateDoc(doc(db, "matieres", editingMatiere.id), {
        nom: editingMatiere.nom.trim(),
        description: editingMatiere.description?.trim() || "",
      });
      setEditingMatiere(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification");
    }
  };

  const handleDeleteMatiere = async (matiere: Matiere) => {
    if (!matiere.id) return;
    if (!window.confirm(`Supprimer la matiere "${matiere.nom}" ?`)) return;

    try {
      await deleteDoc(doc(db, "matieres", matiere.id));
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const totalEleves = eleves.length;
  const totalGarcons = eleves.filter((e) => e.sexe === "M").length;
  const totalFilles = eleves.filter((e) => e.sexe === "F").length;

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
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/eleves" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: colors.textMuted, textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour aux eleves
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: colors.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Classes</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>{classes.length} classe{classes.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {isAdmin && (
              <button
                onClick={() => setShowMatieresModal(true)}
                style={{
                  padding: "12px 20px",
                  background: colors.warningBg,
                  color: colors.warning,
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2.25 3.75H15.75V14.25H2.25V3.75Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 3.75V14.25M2.25 7.5H15.75" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Matieres ({matieres.length})
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowForm(!showForm)}
                style={{
                  padding: "12px 20px",
                  background: showForm ? colors.bgSecondary : `linear-gradient(135deg, ${colors.primary} 0%, #8b5cf6 100%)`,
                  color: showForm ? colors.textMuted : "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                {showForm ? (
                  <>Annuler</>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    Nouvelle classe
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats globales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 8px" }}>Total eleves</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>{totalEleves}</p>
        </div>
        <div style={{ background: "#dbeafe", borderRadius: 12, padding: 20, border: "1px solid #93c5fd" }}>
          <p style={{ fontSize: 13, color: "#3b82f6", margin: "0 0 8px" }}>Garcons</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#2563eb", margin: 0 }}>{totalGarcons}</p>
        </div>
        <div style={{ background: "#fce7f3", borderRadius: 12, padding: 20, border: "1px solid #f9a8d4" }}>
          <p style={{ fontSize: 13, color: "#ec4899", margin: "0 0 8px" }}>Filles</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#db2777", margin: 0 }}>{totalFilles}</p>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: "0 0 20px" }}>Ajouter une classe</h2>
          <form onSubmit={handleAddClasse}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
                  Nom de la classe *
                </label>
                <input
                  type="text"
                  value={newClasse.nom}
                  onChange={(e) => setNewClasse({ ...newClasse, nom: e.target.value })}
                  placeholder="Ex: CP, CE1, 6eme..."
                  required
                  style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
                  Niveau
                </label>
                <input
                  type="text"
                  value={newClasse.niveau}
                  onChange={(e) => setNewClasse({ ...newClasse, niveau: e.target.value })}
                  placeholder="Ex: Primaire, College..."
                  style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: colors.textMuted, marginBottom: 8 }}>
                  Description
                </label>
                <input
                  type="text"
                  value={newClasse.description}
                  onChange={(e) => setNewClasse({ ...newClasse, description: e.target.value })}
                  placeholder="Description optionnelle"
                  style={{ width: "100%", padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: colors.bgInput, color: colors.text }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !newClasse.nom.trim()}
              style={{
                padding: "12px 24px",
                background: saving || !newClasse.nom.trim() ? colors.border : `linear-gradient(135deg, ${colors.primary} 0%, #8b5cf6 100%)`,
                color: saving || !newClasse.nom.trim() ? colors.textMuted : "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: saving || !newClasse.nom.trim() ? "not-allowed" : "pointer"
              }}
            >
              {saving ? "Enregistrement..." : "Ajouter la classe"}
            </button>
          </form>
        </div>
      )}

      {/* Liste des classes */}
      {classes.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucune classe</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {classes.map((classe) => {
            const count = getElevesCount(classe.nom);
            const { garcons, filles } = getElevesByGender(classe.nom);
            const todaysCourses = getTodaysCourses(classe);
            return (
              <div
                key={classe.id || classe.nom}
                style={{
                  background: colors.bgCard,
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  overflow: "hidden",
                  transition: "box-shadow 0.2s"
                }}
              >
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${colors.primary} 0%, #8b5cf6 100%)`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 16
                      }}>
                        {classe.nom.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 18, color: colors.text }}>{classe.nom}</p>
                        {classe.niveau && (
                          <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>{classe.niveau}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {classe.id && isAdmin && (
                        <button
                          onClick={() => openScheduleModal(classe)}
                          title="Emploi du temps"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: colors.primaryBg,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.primary
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M2 6H14M5 1V4M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                      {count === 0 && classe.id && isAdmin && (
                        <button
                          onClick={() => handleDeleteClasse(classe)}
                          title="Supprimer"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: colors.dangerBg,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.danger
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 4H14M5.33 4V2.67C5.33 2.3 5.63 2 6 2H10C10.37 2 10.67 2.3 10.67 2.67V4M6.67 7.33V11.33M9.33 7.33V11.33M3.33 4L4 13.33C4 13.7 4.3 14 4.67 14H11.33C11.7 14 12 13.7 12 13.33L12.67 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div style={{ background: colors.bgSecondary, borderRadius: 8, padding: 12, textAlign: "center" }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>{count}</p>
                      <p style={{ fontSize: 11, color: colors.textMuted, margin: "4px 0 0" }}>Eleves</p>
                    </div>
                    <div style={{ background: "#dbeafe", borderRadius: 8, padding: 12, textAlign: "center" }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6", margin: 0 }}>{garcons}</p>
                      <p style={{ fontSize: 11, color: "#3b82f6", margin: "4px 0 0" }}>Garcons</p>
                    </div>
                    <div style={{ background: "#fce7f3", borderRadius: 8, padding: 12, textAlign: "center" }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: "#ec4899", margin: 0 }}>{filles}</p>
                      <p style={{ fontSize: 11, color: "#ec4899", margin: "4px 0 0" }}>Filles</p>
                    </div>
                  </div>

                  {/* Cours aujourd'hui */}
                  {todaysCourses.length > 0 && (
                    <div style={{ marginTop: 16, padding: 12, background: colors.successBg, borderRadius: 10, border: `1px solid ${colors.success}30` }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: colors.success, margin: "0 0 8px", textTransform: "uppercase" }}>
                        Cours aujourd'hui
                      </p>
                      {todaysCourses.map((slot, idx) => (
                        <div key={idx} style={{ fontSize: 12, color: colors.text, marginBottom: idx < todaysCourses.length - 1 ? 4 : 0 }}>
                          <span style={{ fontWeight: 500 }}>{slot.heureDebut}-{slot.heureFin}</span>: {slot.matiere}
                          {slot.profNom && <span style={{ color: colors.textMuted }}> ({slot.profNom})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {classe.description && (
                    <p style={{ fontSize: 13, color: colors.textMuted, margin: "16px 0 0", fontStyle: "italic" }}>
                      {classe.description}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", borderTop: `1px solid ${colors.border}` }}>
                  <Link
                    to={`/eleves?classe=${encodeURIComponent(classe.nom)}`}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 16px",
                      background: colors.bgSecondary,
                      color: colors.primary,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    Voir les eleves
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                  {classe.id && (
                    <button
                      onClick={() => openScheduleModal(classe)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "12px 16px",
                        background: colors.bgSecondary,
                        borderLeft: `1px solid ${colors.border}`,
                        color: colors.textMuted,
                        border: "none",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M2 6H14M5 1V4M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Emploi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Emploi du temps */}
      {showScheduleModal && selectedClasse && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: colors.bgCard,
            borderRadius: 16,
            width: "100%",
            maxWidth: 700,
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.text }}>Emploi du temps - {selectedClasse.nom}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>{selectedClasse.emploiDuTemps?.length || 0} cours programmes</p>
              </div>
              <button
                onClick={() => { setShowScheduleModal(false); setSelectedClasse(null); }}
                style={{ width: 36, height: 36, borderRadius: 8, background: colors.bgSecondary, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4.5 4.5L13.5 13.5M4.5 13.5L13.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
              {/* Formulaire ajout */}
              {isAdmin && (
                <div style={{ background: colors.bgSecondary, borderRadius: 12, padding: 16, marginBottom: 24 }}>
                  <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: colors.text }}>Ajouter un cours</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr 2fr", gap: 12, marginBottom: 12 }}>
                    <select
                      value={newSlot.jour}
                      onChange={(e) => setNewSlot({ ...newSlot, jour: e.target.value as typeof newSlot.jour })}
                      style={{ padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text }}
                    >
                      {jours.map(j => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
                    </select>
                    <input
                      type="time"
                      value={newSlot.heureDebut}
                      onChange={(e) => setNewSlot({ ...newSlot, heureDebut: e.target.value })}
                      style={{ padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text }}
                    />
                    <input
                      type="time"
                      value={newSlot.heureFin}
                      onChange={(e) => setNewSlot({ ...newSlot, heureFin: e.target.value })}
                      style={{ padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text }}
                    />
                    <select
                      value={newSlot.matiere}
                      onChange={(e) => setNewSlot({ ...newSlot, matiere: e.target.value })}
                      style={{ padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text }}
                    >
                      <option value="">Matiere *</option>
                      {matieres.map((m) => (
                        <option key={m.id} value={m.nom}>{m.nom}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Professeur (optionnel)"
                      value={newSlot.profNom || ""}
                      onChange={(e) => setNewSlot({ ...newSlot, profNom: e.target.value })}
                      style={{ padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, background: colors.bgInput, color: colors.text }}
                    />
                  </div>
                  <button
                    onClick={handleAddSlot}
                    disabled={!newSlot.matiere.trim()}
                    style={{
                      padding: "10px 20px",
                      background: !newSlot.matiere.trim() ? colors.border : `linear-gradient(135deg, ${colors.primary} 0%, #8b5cf6 100%)`,
                      color: !newSlot.matiere.trim() ? colors.textMuted : "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: !newSlot.matiere.trim() ? "not-allowed" : "pointer"
                    }}
                  >
                    Ajouter
                  </button>
                </div>
              )}

              {/* Liste par jour */}
              {jours.map(jour => {
                const slots = (selectedClasse.emploiDuTemps || [])
                  .map((slot, originalIndex) => ({ ...slot, originalIndex }))
                  .filter(slot => slot.jour === jour)
                  .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

                if (slots.length === 0) return null;

                return (
                  <div key={jour} style={{ marginBottom: 20 }}>
                    <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: colors.text, textTransform: "capitalize" }}>{jour}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {slots.map((slot) => (
                        <div
                          key={slot.originalIndex}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: colors.bgSecondary,
                            borderRadius: 10,
                            border: `1px solid ${colors.border}`
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary, minWidth: 100 }}>
                              {slot.heureDebut} - {slot.heureFin}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{slot.matiere}</span>
                            {slot.profNom && (
                              <span style={{ fontSize: 12, color: colors.textMuted }}>({slot.profNom})</span>
                            )}
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => handleRemoveSlot(slot.originalIndex)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: colors.dangerBg,
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: colors.danger
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {(!selectedClasse.emploiDuTemps || selectedClasse.emploiDuTemps.length === 0) && (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <p style={{ color: colors.textMuted, margin: 0 }}>Aucun cours programme</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Matieres */}
      {showMatieresModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: colors.bgCard,
            borderRadius: 16,
            width: "100%",
            maxWidth: 500,
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.text }}>Gestion des matieres</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textMuted }}>{matieres.length} matiere(s)</p>
              </div>
              <button
                onClick={() => { setShowMatieresModal(false); setEditingMatiere(null); }}
                style={{ width: 36, height: 36, borderRadius: 8, background: colors.bgSecondary, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4.5 4.5L13.5 13.5M4.5 13.5L13.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
              {/* Formulaire ajout */}
              <div style={{ background: colors.bgSecondary, borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: colors.text }}>
                  {editingMatiere ? "Modifier la matiere" : "Ajouter une matiere"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input
                    type="text"
                    placeholder="Nom de la matiere *"
                    value={editingMatiere ? editingMatiere.nom : newMatiere.nom}
                    onChange={(e) => editingMatiere
                      ? setEditingMatiere({ ...editingMatiere, nom: e.target.value })
                      : setNewMatiere({ ...newMatiere, nom: e.target.value })
                    }
                    style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text }}
                  />
                  <input
                    type="text"
                    placeholder="Description (optionnel)"
                    value={editingMatiere ? editingMatiere.description || "" : newMatiere.description}
                    onChange={(e) => editingMatiere
                      ? setEditingMatiere({ ...editingMatiere, description: e.target.value })
                      : setNewMatiere({ ...newMatiere, description: e.target.value })
                    }
                    style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 14, background: colors.bgInput, color: colors.text }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    {editingMatiere ? (
                      <>
                        <button
                          onClick={handleUpdateMatiere}
                          disabled={!editingMatiere.nom.trim()}
                          style={{
                            flex: 1,
                            padding: "10px 20px",
                            background: !editingMatiere.nom.trim() ? colors.border : `linear-gradient(135deg, ${colors.primary} 0%, #8b5cf6 100%)`,
                            color: !editingMatiere.nom.trim() ? colors.textMuted : "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: !editingMatiere.nom.trim() ? "not-allowed" : "pointer"
                          }}
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingMatiere(null)}
                          style={{
                            padding: "10px 20px",
                            background: colors.bgSecondary,
                            color: colors.textMuted,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer"
                          }}
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleAddMatiere}
                        disabled={!newMatiere.nom.trim()}
                        style={{
                          padding: "10px 20px",
                          background: !newMatiere.nom.trim() ? colors.border : `linear-gradient(135deg, ${colors.primary} 0%, #8b5cf6 100%)`,
                          color: !newMatiere.nom.trim() ? colors.textMuted : "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: !newMatiere.nom.trim() ? "not-allowed" : "pointer"
                        }}
                      >
                        Ajouter
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Liste des matieres */}
              {matieres.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <p style={{ color: colors.textMuted, margin: 0 }}>Aucune matiere enregistree</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {matieres.map((matiere) => (
                    <div
                      key={matiere.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: colors.bgSecondary,
                        borderRadius: 10,
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: colors.text }}>{matiere.nom}</p>
                        {matiere.description && (
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.textMuted }}>{matiere.description}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setEditingMatiere(matiere)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: colors.primaryBg,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.primary
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M10.08 1.75L12.25 3.92M1.75 12.25L2.33 9.92L10.5 1.75L12.25 3.5L4.08 11.67L1.75 12.25Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMatiere(matiere)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: colors.dangerBg,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.danger
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
