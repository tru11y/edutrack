import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProfesseurById,
  updateProfesseur,
  desactiverProfesseur,
} from "./professeur.service";
import type { Professeur } from "./professeur.types";

export default function ProfesseurProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [prof, setProf] = useState<Professeur | null>(null);
  const [editing, setEditing] = useState(false);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [matieres, setMatieres] = useState("");

  useEffect(() => {
    if (!id) return;
    getProfesseurById(id).then((data) => {
      if (!data) return;
      setProf(data);
      setNom(data.nom);
      setPrenom(data.prenom);
      setMatieres(data.matieres.join(", "));
    });
  }, [id]);

  if (!prof) return <p>Chargement...</p>;

  const handleSave = async () => {
    if (!id) return;
    await updateProfesseur(id, {
      nom,
      prenom,
      matieres: matieres.split(",").map((m) => m.trim()),
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Supprimer ce professeur ?")) return;
    await desactiverProfesseur(id);
    navigate("/admin/professeurs");
  };

  return (
    <div>
      <h1>Fiche Professeur</h1>

      {!editing ? (
        <>
          <p><b>Nom :</b> {prof.nom}</p>
          <p><b>Prénom :</b> {prof.prenom}</p>
          <p><b>Matières :</b> {prof.matieres.join(", ")}</p>

          <button onClick={() => setEditing(true)}>✏️ Modifier</button>
          <button onClick={handleDelete} style={{ marginLeft: 10, color: "red" }}>
            🗑 Supprimer
          </button>
        </>
      ) : (
        <>
          <input value={nom} onChange={(e) => setNom(e.target.value)} />
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
          <input value={matieres} onChange={(e) => setMatieres(e.target.value)} />

          <button onClick={handleSave}>💾 Enregistrer</button>
          <button onClick={() => setEditing(false)}>Annuler</button>
        </>
      )}
    </div>
  );
}
