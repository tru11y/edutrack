import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getAllEleves } from "../../modules/eleves/eleve.service";
import { getAllProfesseurs } from "../../modules/professeurs/professeur.service";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { LoadingSpinner } from "../../components/ui/Skeleton";
import { useToast, ConfirmModal } from "../../components/ui";
import { GRADIENTS } from "../../constants";
import { ClassCard, ClassForm, GenderStatsCard, MatieresModal, ScheduleModal } from "./components";
import type { Eleve } from "../../modules/eleves/eleve.types";
import type { Professeur } from "../../modules/professeurs/professeur.types";
import type { ClasseData, Matiere, ScheduleSlot } from "./types";

export default function Classes() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "gestionnaire";

  // Data state
  const [classes, setClasses] = useState<ClasseData[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMatieresModal, setShowMatieresModal] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState<ClasseData | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; variant: "danger" | "warning" | "info"; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info", onConfirm: () => {} });

  // Data loading
  const loadData = useCallback(async () => {
    try {
      const [classesSnap, matieresSnap, elevesData, profsData] = await Promise.all([
        getDocs(collection(db, "classes")),
        getDocs(collection(db, "matieres")),
        getAllEleves(),
        getAllProfesseurs(),
      ]);

      const classesData = classesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClasseData[];
      const matieresData = matieresSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Matiere[];

      setMatieres(matieresData.sort((a, b) => a.nom.localeCompare(b.nom)));
      setProfesseurs(profsData.filter((p) => p.statut === "actif"));
      setEleves(elevesData);

      // Ajouter les classes des eleves qui n'existent pas encore
      const elevesClasses = [...new Set(elevesData.map((e) => e.classe).filter(Boolean))];
      const existingClassNames = classesData.map((c) => c.nom);
      const allClasses = [...classesData];

      for (const className of elevesClasses) {
        if (!existingClassNames.includes(className)) {
          allClasses.push({ nom: className });
        }
      }

      setClasses(allClasses.sort((a, b) => a.nom.localeCompare(b.nom)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helpers
  const getElevesCount = (className: string) => eleves.filter((e) => e.classe === className).length;

  const getElevesByGender = (className: string) => {
    const classEleves = eleves.filter((e) => e.classe === className);
    return {
      garcons: classEleves.filter((e) => e.sexe === "M").length,
      filles: classEleves.filter((e) => e.sexe === "F").length,
    };
  };

  const getTodaysCourses = (classe: ClasseData): ScheduleSlot[] => {
    if (!classe.emploiDuTemps) return [];
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long" }).toLowerCase();
    return classe.emploiDuTemps.filter((slot) => slot.jour === today);
  };

  // Handlers
  const handleAddClasse = async (data: { nom: string; niveau: string; description: string }) => {
    await addDoc(collection(db, "classes"), {
      nom: data.nom.trim(),
      niveau: data.niveau.trim() || null,
      description: data.description.trim() || null,
    });
    setShowForm(false);
    await loadData();
  };

  const handleDeleteClasse = (classe: ClasseData) => {
    const count = getElevesCount(classe.nom);
    if (count > 0) {
      toast.warning(`Impossible de supprimer: ${count} eleve(s) dans cette classe`);
      return;
    }
    if (!classe.id) {
      toast.error("Cette classe n'est pas enregistree dans la base");
      return;
    }
    setConfirmState({
      isOpen: true, title: "Supprimer la classe", message: `Supprimer la classe "${classe.nom}" ?`, variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        await deleteDoc(doc(db, "classes", classe.id!));
        await loadData();
        toast.success("Classe supprimee");
      },
    });
  };

  const handleAddSlot = async (slot: ScheduleSlot) => {
    if (!selectedClasse?.id) return;
    const currentSchedule = selectedClasse.emploiDuTemps || [];
    const updatedSchedule = [...currentSchedule, { ...slot, matiere: slot.matiere.trim(), profId: slot.profId || "", profNom: slot.profNom?.trim() || "" }];
    await updateDoc(doc(db, "classes", selectedClasse.id), { emploiDuTemps: updatedSchedule });
    await loadData();
    setSelectedClasse((prev) => (prev ? { ...prev, emploiDuTemps: updatedSchedule } : null));
  };

  const handleRemoveSlot = async (index: number) => {
    if (!selectedClasse?.id) return;
    const updatedSchedule = (selectedClasse.emploiDuTemps || []).filter((_, i) => i !== index);
    await updateDoc(doc(db, "classes", selectedClasse.id), { emploiDuTemps: updatedSchedule });
    await loadData();
    setSelectedClasse((prev) => (prev ? { ...prev, emploiDuTemps: updatedSchedule } : null));
  };

  const handleAddMatiere = async (data: { nom: string; description: string }) => {
    await addDoc(collection(db, "matieres"), {
      nom: data.nom.trim(),
      description: data.description?.trim() || "",
    });
    await loadData();
  };

  const handleUpdateMatiere = async (matiere: Matiere) => {
    if (!matiere.id) return;
    await updateDoc(doc(db, "matieres", matiere.id), {
      nom: matiere.nom.trim(),
      description: matiere.description?.trim() || "",
    });
    await loadData();
  };

  const handleDeleteMatiere = (matiere: Matiere) => {
    if (!matiere.id) return;
    setConfirmState({
      isOpen: true, title: "Supprimer la matiere", message: `Supprimer la matiere "${matiere.nom}" ?`, variant: "danger",
      onConfirm: async () => {
        setConfirmState((s) => ({ ...s, isOpen: false }));
        await deleteDoc(doc(db, "matieres", matiere.id!));
        await loadData();
        toast.success("Matiere supprimee");
      },
    });
  };

  // Stats
  const totalEleves = eleves.length;
  const totalGarcons = eleves.filter((e) => e.sexe === "M").length;
  const totalFilles = eleves.filter((e) => e.sexe === "F").length;

  if (loading) {
    return <LoadingSpinner text="Chargement des classes..." />;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          to="/eleves"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: colors.textMuted,
            textDecoration: "none",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour aux eleves
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: colors.primaryBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.primary,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Classes</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
                {classes.length} classe{classes.length > 1 ? "s" : ""}
              </p>
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
                  gap: 8,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2.25 3.75H15.75V14.25H2.25V3.75Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6 3.75V14.25M2.25 7.5H15.75" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Matieres ({matieres.length})
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowForm(!showForm)}
                style={{
                  padding: "12px 20px",
                  background: showForm ? colors.bgSecondary : GRADIENTS.primary,
                  color: showForm ? colors.textMuted : colors.onGradient,
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {showForm ? (
                  "Annuler"
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Nouvelle classe
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <GenderStatsCard totalEleves={totalEleves} totalGarcons={totalGarcons} totalFilles={totalFilles} />

      {/* Form */}
      {showForm && <ClassForm onSubmit={handleAddClasse} onCancel={() => setShowForm(false)} existingNames={classes.map((c) => c.nom)} />}

      {/* Liste */}
      {classes.length === 0 ? (
        <div style={{ background: colors.bgCard, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>Aucune classe</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {classes.map((classe) => {
            const { garcons, filles } = getElevesByGender(classe.nom);
            return (
              <ClassCard
                key={classe.id || classe.nom}
                classe={classe}
                elevesCount={getElevesCount(classe.nom)}
                garcons={garcons}
                filles={filles}
                todaysCourses={getTodaysCourses(classe)}
                isAdmin={isAdmin}
                onOpenSchedule={() => {
                  setSelectedClasse(classe);
                  setShowScheduleModal(true);
                }}
                onDelete={() => handleDeleteClasse(classe)}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showScheduleModal && selectedClasse && (
        <ScheduleModal
          classe={selectedClasse}
          matieres={matieres}
          professeurs={professeurs.filter((p): p is Professeur & { id: string } => !!p.id)}
          isAdmin={isAdmin}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedClasse(null);
          }}
          onAddSlot={handleAddSlot}
          onRemoveSlot={handleRemoveSlot}
        />
      )}

      {showMatieresModal && (
        <MatieresModal
          matieres={matieres}
          onClose={() => setShowMatieresModal(false)}
          onAdd={handleAddMatiere}
          onUpdate={handleUpdateMatiere}
          onDelete={handleDeleteMatiere}
        />
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
