import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProfesseur } from "./professeur.service";

export default function CreateProfesseur() {
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [matieres, setMatieres] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const data = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        matieres: matieres.split(",").map(m => m.trim()),
      };

      await createProfesseur(data);

      alert("Professeur créé");
      navigate(-1);
    } catch (error) {
      alert("Erreur création professeur");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Créer un professeur</h1>

      <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
      <input
        placeholder="Prénom"
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
      />
      <input
        placeholder="Matières (séparées par ,)"
        value={matieres}
        onChange={(e) => setMatieres(e.target.value)}
      />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  );
}
