import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import { getAllEleves } from "../eleves/eleve.service";
import { getElevesEligibles } from "../eleves/eleve.select.service";

import { savePresencesForCours } from "./presence.service";
import { createCahierEntry } from "../cahier/cahier.service";
import { banEleveByProf } from "../eleves/eleve.ban.service";

import type { PresenceItem } from "./presence.types";

interface Props {
  coursId: string;
  classe: string;
}

export default function PresenceAppel({ coursId, classe }: Props) {
  const { user } = useAuth();

  const [eleves, setEleves] = useState<any[]>([]);
  const [presences, setPresences] = useState<PresenceItem[]>([]);
  const [allEleves, setAllEleves] = useState<any[]>([]);

  const [selectedEleveId, setSelectedEleveId] = useState("");
  const [contenu, setContenu] = useState("");
  const [devoirs, setDevoirs] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllEleves().then((data) => {
      const filtres = data.filter(
        (e) => e.classe === classe && !e.isBanned
      );

      setEleves(filtres);

      setPresences(
        filtres.map((e) => ({
          eleveId: e.id,
          statut: "present" as const,
          facturable: true,
          statutMetier: "autorise" as const,
          message: "",
        }))
      );
    });

    getElevesEligibles().then(setAllEleves);
  }, [classe]);

  const updatePresence = (
    eleveId: string,
    statut: "present" | "absent" | "retard",
    minutesRetard = 0
  ) => {
    setPresences((prev) =>
      prev.map((p) =>
        p.eleveId === eleveId
          ? { ...p, statut, minutesRetard }
          : p
      )
    );
  };

  const handleExclude = async (eleveId: string) => {
    const confirm = window.confirm(
      "Exclure cet élève pour non paiement ?"
    );

    if (!confirm) return;

    await banEleveByProf(eleveId, "Non paiement");

    setEleves((prev) => prev.filter((e) => e.id !== eleveId));
    setPresences((prev) => prev.filter((p) => p.eleveId !== eleveId));

    alert("Élève exclu et signalé à l’administration");
  };

  const handleAddEleve = () => {
    if (!selectedEleveId) return;

    const eleve = allEleves.find((e) => e.id === selectedEleveId);
    if (!eleve) return;

    if (presences.some((p) => p.eleveId === eleve.id)) {
      alert("Élève déjà présent");
      return;
    }

    setEleves((prev) => [...prev, eleve]);

    setPresences((prev) => [
      ...prev,
      {
        eleveId: eleve.id,
        statut: "present",
      },
    ]);

    setSelectedEleveId("");
  };

  const handleSave = async () => {
    setLoading(true);

    const date = new Date().toISOString().split("T")[0];

    const presents = presences
      .filter((p) => p.statut === "present" || p.statut === "retard")
      .map((p) => p.eleveId);

    // 1) sauvegarde des présences
    await savePresencesForCours({
      coursId,
      classe,
      date,
      presences,
    });

    // 2) écriture auto dans le cahier de texte
    await createCahierEntry({
      coursId,
      date,
      classe,
      profId: user!.uid,
      profNom: user!.uid,
      eleves: presents,
      contenu: contenu.trim(),
      devoirs: devoirs.trim() || undefined,
    });

    setLoading(false);
    alert("Présences + cahier enregistrés");
  };

  return (
    <div className="space-y-6">

      <h3 className="text-lg font-bold">📋 Appel & Cahier de texte</h3>

      {/* CONTENU DU COURS */}
      <div className="space-y-2">
        <textarea
          placeholder="Contenu du cours (obligatoire)"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          className="w-full border p-2 rounded"
          rows={4}
        />

        <textarea
          placeholder="Devoirs (optionnel)"
          value={devoirs}
          onChange={(e) => setDevoirs(e.target.value)}
          className="w-full border p-2 rounded"
          rows={3}
        />
      </div>

      {/* AJOUT MANUEL */}
      <div className="flex gap-2">
        <select
          value={selectedEleveId}
          onChange={(e) => setSelectedEleveId(e.target.value)}
          className="border p-2 rounded w-64"
        >
          <option value="">➕ Ajouter un élève...</option>
          {allEleves.map((e) => (
            <option key={e.id} value={e.id}>
              {e.prenom} {e.nom} — {e.classe}
            </option>
          ))}
        </select>

        <button
          onClick={handleAddEleve}
          className="bg-blue-600 text-white px-3 py-2 rounded"
        >
          Ajouter
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Élève</th>
            <th className="border p-2">Présent</th>
            <th className="border p-2">Absent</th>
            <th className="border p-2">Retard</th>
            <th className="border p-2">Minutes</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {eleves.map((e) => (
            <tr key={e.id}>
              <td className="border p-2">
                {e.prenom} {e.nom} ({e.classe})
              </td>

              <td className="border p-2 text-center">
                <input
                  type="radio"
                  name={e.id}
                  defaultChecked
                  onChange={() =>
                    updatePresence(e.id, "present")
                  }
                />
              </td>

              <td className="border p-2 text-center">
                <input
                  type="radio"
                  name={e.id}
                  onChange={() =>
                    updatePresence(e.id, "absent")
                  }
                />
              </td>

              <td className="border p-2 text-center">
                <input
                  type="radio"
                  name={e.id}
                  onChange={() =>
                    updatePresence(e.id, "retard", 5)
                  }
                />
              </td>

              <td className="border p-2 text-center">
                <input
                  type="number"
                  min={0}
                  className="w-16 border p-1 rounded"
                  onChange={(ev) =>
                    updatePresence(
                      e.id,
                      "retard",
                      Number(ev.target.value)
                    )
                  }
                />
              </td>

              <td className="border p-2 text-center">
                <button
                  onClick={() => handleExclude(e.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                >
                  🚫 Exclure
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSave}
        disabled={loading || !contenu.trim()}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading
          ? "Enregistrement…"
          : "💾 Enregistrer appel + cahier"}
      </button>

    </div>
  );
}
