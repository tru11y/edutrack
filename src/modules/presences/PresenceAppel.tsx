import { useEffect, useState } from "react";
import { getAllEleves } from "../eleves/eleve.service";
import { savePresencesForCours } from "./presence.service";
import type { Presence } from "./presence.types";

interface Props {
  coursId: string;
  classe: string;
}

export default function PresenceAppel({ coursId, classe }: Props) {
  const [eleves, setEleves] = useState<{ id: string; nom: string; prenom: string }[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllEleves().then((data) => {
      const filtres = data.filter((e) => e.classe === classe && e.id);

      setEleves(
        filtres.map((e) => ({
          id: e.id!,
          nom: e.nom,
          prenom: e.prenom,
        }))
      );

      setPresences(
        filtres.map((e) => ({
          eleveId: e.id!,
          statut: "present",
          minutesRetard: 0,
        }))
      );
    });
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

  const handleSave = async () => {
    try {
      setSaving(true);

      await savePresencesForCours({
        coursId,
        classe,
        date: new Date().toISOString().split("T")[0],
        presences,
      });

      alert("Présences enregistrées");
    } catch {
      alert("Erreur lors de l’enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">📋 Appel des élèves</h3>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Élève</th>
            <th className="border p-2">Présent</th>
            <th className="border p-2">Absent</th>
            <th className="border p-2">Retard</th>
            <th className="border p-2">Minutes</th>
          </tr>
        </thead>
        <tbody>
          {eleves.map((e) => (
            <tr key={e.id}>
              <td className="border p-2">
                {e.prenom} {e.nom}
              </td>

              <td className="border p-2 text-center">
                <input
                  type="radio"
                  name={e.id}
                  defaultChecked
                  onChange={() => updatePresence(e.id, "present")}
                />
              </td>

              <td className="border p-2 text-center">
                <input
                  type="radio"
                  name={e.id}
                  onChange={() => updatePresence(e.id, "absent")}
                />
              </td>

              <td className="border p-2 text-center">
                <input
                  type="radio"
                  name={e.id}
                  onChange={() => updatePresence(e.id, "retard", 5)}
                />
              </td>

              <td className="border p-2">
                <input
                  type="number"
                  min={0}
                  className="border p-1 w-20"
                  onChange={(ev) =>
                    updatePresence(
                      e.id,
                      "retard",
                      Number(ev.target.value)
                    )
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : "💾 Enregistrer l’appel"}
      </button>
    </div>
  );
}
