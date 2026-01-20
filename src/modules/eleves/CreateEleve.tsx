import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEleve } from "./eleve.service";
import type { Eleve, ParentContact } from "./eleve.types";

const emptyParent: ParentContact = {
  nom: "",
  telephone: "",
  lien: "pere",
};

export default function CreateEleve() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Eleve>({
    nom: "",
    prenom: "",
    sexe: "M",
    classe: "",
    parents: [{ ...emptyParent }],
    statut: "actif",
  });

  const updateField = (field: keyof Eleve, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const updateParent = (index: number, field: keyof ParentContact, value: any) => {
    const parents = [...form.parents];
    parents[index] = { ...parents[index], [field]: value };
    setForm((f) => ({ ...f, parents }));
  };

  const addParent = () => {
    setForm((f) => ({ ...f, parents: [...f.parents, { ...emptyParent }] }));
  };

  const handleSubmit = async () => {
    try {
      setError("");
      setLoading(true);
      await createEleve(form);
      navigate("/admin/eleves");
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">➕ Nouvel élève</h1>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <input
        placeholder="Nom"
        className="input"
        value={form.nom}
        onChange={(e) => updateField("nom", e.target.value)}
      />

      <input
        placeholder="Prénom"
        className="input"
        value={form.prenom}
        onChange={(e) => updateField("prenom", e.target.value)}
      />

      <select
        className="input"
        value={form.sexe}
        onChange={(e) => updateField("sexe", e.target.value)}
      >
        <option value="M">Masculin</option>
        <option value="F">Féminin</option>
      </select>

      <input
        placeholder="Classe"
        className="input"
        value={form.classe}
        onChange={(e) => updateField("classe", e.target.value)}
      />

      <h2 className="font-semibold mt-4 mb-2">👨‍👩‍👧 Parents</h2>

      {form.parents.map((p, i) => (
        <div key={i} className="border p-2 mb-2 rounded">
          <input
            placeholder="Nom"
            className="input"
            value={p.nom}
            onChange={(e) => updateParent(i, "nom", e.target.value)}
          />
          <input
            placeholder="Téléphone"
            className="input"
            value={p.telephone}
            onChange={(e) => updateParent(i, "telephone", e.target.value)}
          />
          <select
            className="input"
            value={p.lien}
            onChange={(e) => updateParent(i, "lien", e.target.value)}
          >
            <option value="pere">Père</option>
            <option value="mere">Mère</option>
            <option value="tuteur">Tuteur</option>
          </select>
        </div>
      ))}

      <button onClick={addParent} className="btn-secondary mb-4">
        ➕ Ajouter un parent
      </button>

      <button
        disabled={loading}
        onClick={handleSubmit}
        className="btn-primary"
      >
        {loading ? "Création..." : "Créer l’élève"}
      </button>
    </div>
  );
}
