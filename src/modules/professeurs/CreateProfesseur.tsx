import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function CreateProfesseur() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    specialite: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nom || !form.prenom || !form.email) {
      setError("Nom, prénom et email sont obligatoires");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 1) Créer le prof dans la collection professeurs
      await addDoc(collection(db, "professeurs"), {
        ...form,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      // 2) Créer l'utilisateur dans la collection users
      await addDoc(collection(db, "users"), {
        email: form.email,
        role: "prof",
        isActive: true,
        createdAt: serverTimestamp(),
      });

      navigate("/admin/professeurs");
    } catch (e) {
      console.error(e);
      setError("Erreur lors de la création du professeur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">➕ Ajouter un professeur</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm"
      >
        <Field
          label="Nom"
          name="nom"
          value={form.nom}
          onChange={handleChange}
        />

        <Field
          label="Prénom"
          name="prenom"
          value={form.prenom}
          onChange={handleChange}
        />

        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />

        <Field
          label="Téléphone"
          name="telephone"
          value={form.telephone}
          onChange={handleChange}
        />

        <Field
          label="Spécialité"
          name="specialite"
          value={form.specialite}
          onChange={handleChange}
        />

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer le professeur"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-xl border border-gray-300 font-medium hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================
   UI FIELD
========================= */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />
    </div>
  );
}
