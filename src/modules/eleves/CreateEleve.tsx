import { useState } from "react";
import type { ParentContact } from "./eleve.types";
import { useNavigate } from "react-router-dom";
import { createEleve, createEleveWithAccount } from "./eleve.service";

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

  const [createAccount, setCreateAccount] = useState(false);
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

      // Validation basique
      if (!form.nom.trim() || !form.prenom.trim() || !form.classe.trim()) {
        throw new Error("Nom, prénom et classe sont obligatoires");
      }

      // Si on veut créer un compte, vérifier email et password
      if (createAccount) {
        if (!form.email.trim() || !form.password.trim()) {
          throw new Error("Email et mot de passe requis pour créer un compte");
        }
        if (form.password.length < 6) {
          throw new Error("Le mot de passe doit avoir au moins 6 caractères");
        }

        await createEleveWithAccount({
          nom: form.nom,
          prenom: form.prenom,
          classe: form.classe,
          sexe: form.sexe as "M" | "F",
          email: form.email,
          password: form.password,
          parents: form.parents.filter(p => p.nom.trim() && p.telephone.trim()),
        });
      } else {
        // Créer seulement l'élève sans compte Firebase Auth
        await createEleve({
          nom: form.nom,
          prenom: form.prenom,
          classe: form.classe,
          sexe: form.sexe as "M" | "F",
          parents: form.parents.filter(p => p.nom.trim() && p.telephone.trim()),
        });
      }

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

      {/* Option pour créer un compte */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="createAccount"
          checked={createAccount}
          onChange={(e) => setCreateAccount(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="createAccount" className="text-sm text-gray-700">
          Créer un compte de connexion pour cet élève (optionnel)
        </label>
      </div>

      {createAccount && (
        <div className="space-y-3 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">Identifiants de connexion</p>
          <input
            name="email"
            type="email"
            placeholder="Email élève"
            value={form.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={form.password}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-2xl px-6 py-3 font-semibold text-white shadow-lg bg-gradient-to-tr from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 transition text-lg mt-4 disabled:opacity-50"
        style={{ letterSpacing: 1 }}
      >
        {loading ? "Création..." : "Créer l’élève"}
      </button>

      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
