import { useState } from "react";
import type { ParentContact } from "./eleve.types";
import { useNavigate } from "react-router-dom";
import { createEleveWithAccount } from "./eleve.service";

export default function CreateEleve() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    classe: "",
    sexe: "M",
    email: "",
    password: "",
    parents: [
      { nom: "", telephone: "", lien: "pere" as const },
    ] as ParentContact[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle parent field changes
  const handleParentChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const updated = form.parents.map((parent, i) =>
      i === idx ? { ...parent, [e.target.name]: e.target.value } : parent
    );
    setForm({ ...form, parents: updated });
  };

  const addParent = () => {
    setForm({
      ...form,
      parents: [
        ...form.parents,
        { nom: "", telephone: "", lien: "pere" as const },
      ],
    });
  };

  const removeParent = (idx: number) => {
    setForm({
      ...form,
      parents: form.parents.filter((_, i) => i !== idx),
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      await createEleveWithAccount({
        nom: form.nom,
        prenom: form.prenom,
        classe: form.classe,
        sexe: form.sexe as "M" | "F",
        email: form.email,
        password: form.password,
        parents: form.parents,
      });

      navigate("/admin/eleves");
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-xl font-bold">➕ Nouvel élève</h1>

      <input
        name="nom"
        placeholder="Nom"
        value={form.nom}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        name="prenom"
        placeholder="Prénom"
        value={form.prenom}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        name="classe"
        placeholder="Classe"
        value={form.classe}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <label htmlFor="sexe" className="block font-medium mb-1">Sexe</label>
      <select
        id="sexe"
        name="sexe"
        value={form.sexe}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        aria-label="Sexe"
      >
        <option value="M">Masculin</option>
        <option value="F">Féminin</option>
      </select>


      <hr />
      <div className="space-y-2">
        <div className="font-semibold">Parents</div>
        {form.parents.map((parent, idx) => (
          <div key={idx} className="flex gap-2 items-end border p-2 rounded mb-2 bg-gray-50">
            <div className="flex-1">
              <input
                name="nom"
                placeholder="Nom du parent"
                value={parent.nom}
                onChange={e => handleParentChange(idx, e)}
                className="w-full border p-2 rounded mb-1"
                required
              />
              <input
                name="telephone"
                placeholder="Téléphone"
                value={parent.telephone}
                onChange={e => handleParentChange(idx, e)}
                className="w-full border p-2 rounded mb-1"
                required
              />
              <select
                name="lien"
                value={parent.lien}
                onChange={e => handleParentChange(idx, e)}
                className="w-full border p-2 rounded"
                aria-label="Lien avec l'élève"
              >
                <option value="pere">Père</option>
                <option value="mere">Mère</option>
                <option value="tuteur">Tuteur</option>
              </select>
            </div>
            {form.parents.length > 1 && (
              <button type="button" onClick={() => removeParent(idx)} className="text-red-600 font-bold px-2">✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addParent} className="bg-gray-200 px-3 py-1 rounded">+ Ajouter un parent</button>
      </div>
      <hr />

      <input
        name="email"
        placeholder="Email élève"
        value={form.email}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <input
        type="password"
        name="password"
        placeholder="Mot de passe"
        value={form.password}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Création..." : "Créer l’élève"}
      </button>

      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
