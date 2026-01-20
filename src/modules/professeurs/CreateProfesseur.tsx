import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProfesseur } from "./professeur.service";

export default function CreateProfesseur() {
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [matieres, setMatieres] = useState("");

  const handleSubmit = async () => {
  setLoading(true);

  const profId = await createProfesseur(data);

  await createUserProfile(firebaseUid, "prof", {
    professeurId: profId,
  });

  toast.success("Professeur créé");
  navigate(-1);

  setLoading(false);
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

      <button onClick={handleSubmit}>Enregistrer</button>
    </div>
  );
}
