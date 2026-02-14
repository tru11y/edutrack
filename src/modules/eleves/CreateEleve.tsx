import { useState } from "react";
import type { ParentContact } from "./eleve.types";
import { useNavigate } from "react-router-dom";
import { createEleve, createEleveWithAccount } from "./eleve.service";
import { useTheme } from "../../context/ThemeContext";

export default function CreateEleve() {
  const navigate = useNavigate();
  const { colors } = useTheme();

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    background: colors.bgInput,
    color: colors.text,
    boxSizing: "border-box" as const,
  };

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-xl font-bold" style={{ color: colors.text }}>Nouvel élève</h1>

      <input
        name="nom"
        placeholder="Nom"
        value={form.nom}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="prenom"
        placeholder="Prénom"
        value={form.prenom}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="classe"
        placeholder="Classe"
        value={form.classe}
        onChange={handleChange}
        style={inputStyle}
      />

      <label htmlFor="sexe" className="block font-medium mb-1" style={{ color: colors.text }}>Sexe</label>
      <select
        id="sexe"
        name="sexe"
        value={form.sexe}
        onChange={handleChange}
        style={inputStyle}
        aria-label="Sexe"
      >
        <option value="M">Masculin</option>
        <option value="F">Féminin</option>
      </select>

      <hr style={{ borderColor: colors.border }} />
      <div className="space-y-2">
        <div className="font-semibold" style={{ color: colors.text }}>Parents</div>
        {form.parents.map((parent, idx) => (
          <div
            key={idx}
            className="flex gap-2 items-end p-2 rounded mb-2"
            style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}` }}
          >
            <div className="flex-1">
              <input
                name="nom"
                placeholder="Nom du parent"
                value={parent.nom}
                onChange={e => handleParentChange(idx, e)}
                style={{ ...inputStyle, marginBottom: 4 }}
                required
              />
              <input
                name="telephone"
                placeholder="Téléphone"
                value={parent.telephone}
                onChange={e => handleParentChange(idx, e)}
                style={{ ...inputStyle, marginBottom: 4 }}
                required
              />
              <select
                name="lien"
                value={parent.lien}
                onChange={e => handleParentChange(idx, e)}
                style={inputStyle}
                aria-label="Lien avec l'élève"
              >
                <option value="pere">Père</option>
                <option value="mere">Mère</option>
                <option value="tuteur">Tuteur</option>
              </select>
            </div>
            {form.parents.length > 1 && (
              <button
                type="button"
                onClick={() => removeParent(idx)}
                className="font-bold px-2"
                style={{ color: colors.danger }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addParent}
          style={{ background: colors.bgSecondary, color: colors.textSecondary, padding: "6px 12px", borderRadius: 6, border: `1px solid ${colors.border}` }}
        >
          + Ajouter un parent
        </button>
      </div>
      <hr style={{ borderColor: colors.border }} />

      {/* Option pour créer un compte */}
      <div
        className="flex items-center gap-3 p-3 rounded-lg"
        style={{ background: colors.bgSecondary }}
      >
        <input
          type="checkbox"
          id="createAccount"
          checked={createAccount}
          onChange={(e) => setCreateAccount(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="createAccount" className="text-sm" style={{ color: colors.textSecondary }}>
          Créer un compte de connexion pour cet élève (optionnel)
        </label>
      </div>

      {createAccount && (
        <div
          className="space-y-3 p-4 rounded-lg"
          style={{ background: colors.infoBg, border: `1px solid ${colors.info}40` }}
        >
          <p className="text-sm font-medium" style={{ color: colors.info }}>Identifiants de connexion</p>
          <input
            name="email"
            type="email"
            placeholder="Email élève"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            type="password"
            name="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={form.password}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 24px",
          background: colors.primary,
          color: colors.onGradient,
          border: "none",
          borderRadius: 10,
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          marginTop: 16,
        }}
      >
        {loading ? "Création..." : "Créer l'élève"}
      </button>

      {error && <p style={{ color: colors.danger }}>{error}</p>}
    </div>
  );
}
