import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getAllEleves } from "../modules/eleves/eleve.service";
import type { Eleve } from "../modules/eleves/eleve.types";

interface ClasseData {
  id?: string;
  nom: string;
  niveau?: string;
  description?: string;
}

export default function Classes() {
  const [classes, setClasses] = useState<ClasseData[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newClasse, setNewClasse] = useState({ nom: "", niveau: "", description: "" });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      // Charger les classes depuis Firestore
      const classesSnap = await getDocs(collection(db, "classes"));
      const classesData = classesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClasseData[];

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

  const totalEleves = eleves.length;
  const totalGarcons = eleves.filter((e) => e.sexe === "M").length;
  const totalFilles = eleves.filter((e) => e.sexe === "F").length;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/eleves" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", textDecoration: "none", fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Retour aux eleves
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>Classes</h1>
              <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>{classes.length} classe{classes.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: "12px 20px",
              background: showForm ? "#f1f5f9" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: showForm ? "#64748b" : "#fff",
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
        </div>
      </div>

      {/* Stats globales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px" }}>Total eleves</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", margin: 0 }}>{totalEleves}</p>
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
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: "0 0 20px" }}>Ajouter une classe</h2>
          <form onSubmit={handleAddClasse}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
                  Nom de la classe *
                </label>
                <input
                  type="text"
                  value={newClasse.nom}
                  onChange={(e) => setNewClasse({ ...newClasse, nom: e.target.value })}
                  placeholder="Ex: CP, CE1, 6eme..."
                  required
                  style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
                  Niveau
                </label>
                <input
                  type="text"
                  value={newClasse.niveau}
                  onChange={(e) => setNewClasse({ ...newClasse, niveau: e.target.value })}
                  placeholder="Ex: Primaire, College..."
                  style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>
                  Description
                </label>
                <input
                  type="text"
                  value={newClasse.description}
                  onChange={(e) => setNewClasse({ ...newClasse, description: e.target.value })}
                  placeholder="Description optionnelle"
                  style={{ width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !newClasse.nom.trim()}
              style={{
                padding: "12px 24px",
                background: saving || !newClasse.nom.trim() ? "#e2e8f0" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: saving || !newClasse.nom.trim() ? "#94a3b8" : "#fff",
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
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Aucune classe</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {classes.map((classe) => {
            const count = getElevesCount(classe.nom);
            const { garcons, filles } = getElevesByGender(classe.nom);
            return (
              <div
                key={classe.id || classe.nom}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
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
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
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
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 18, color: "#1e293b" }}>{classe.nom}</p>
                        {classe.niveau && (
                          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{classe.niveau}</p>
                        )}
                      </div>
                    </div>
                    {count === 0 && classe.id && (
                      <button
                        onClick={() => handleDeleteClasse(classe)}
                        title="Supprimer"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#fef2f2",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ef4444"
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4H14M5.33 4V2.67C5.33 2.3 5.63 2 6 2H10C10.37 2 10.67 2.3 10.67 2.67V4M6.67 7.33V11.33M9.33 7.33V11.33M3.33 4L4 13.33C4 13.7 4.3 14 4.67 14H11.33C11.7 14 12 13.7 12 13.33L12.67 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, textAlign: "center" }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>{count}</p>
                      <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>Eleves</p>
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

                  {classe.description && (
                    <p style={{ fontSize: 13, color: "#64748b", margin: "16px 0 0", fontStyle: "italic" }}>
                      {classe.description}
                    </p>
                  )}
                </div>

                <Link
                  to={`/eleves?classe=${encodeURIComponent(classe.nom)}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderTop: "1px solid #e2e8f0",
                    color: "#6366f1",
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
