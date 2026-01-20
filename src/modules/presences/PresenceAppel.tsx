import { useEffect, useState } from "react";
import { getAllEleves } from "../eleves/eleve.service";
import { savePresencesForCours } from "./presence.service";
import { computeStatutMetier } from "./presence.rules";
import { banEleve } from "../eleves/eleve.ban";

interface Props {
  coursId: string;
  classe: string;
}

export default function PresenceAppel({ coursId, classe }: Props) {
  const [eleves, setEleves] = useState<any[]>([]);
  const [presences, setPresences] = useState<any[]>([]);
  const [metier, setMetier] = useState<Record<string, any>>({});

  useEffect(() => {
    const load = async () => {
      const data = await getAllEleves();
      const filtres = data.filter((e) => e.classe === classe);

      const metierMap: any = {};
      for (const e of filtres) {
        if (e.id) {
          metierMap[e.id] = await computeStatutMetier(e.id);
        }
      }

      setEleves(filtres);
      setMetier(metierMap);
      setPresences(
        filtres.map((e) => ({
          eleveId: e.id,
          statut: "present",
          minutesRetard: 0,
        }))
      );
    };

    load();
  }, [classe]);

  const updatePresence = (eleveId: string, statut: string, minutesRetard = 0) => {
    setPresences((prev) =>
      prev.map((p) =>
        p.eleveId === eleveId ? { ...p, statut, minutesRetard } : p
      )
    );
  };

  const handleExclude = async (eleveId: string) => {
    await banEleve(eleveId);
    alert("Élève exclu (non paiement)");
  };

  const handleSave = async () => {
    await savePresencesForCours({
      coursId,
      classe,
      date: new Date().toISOString().split("T")[0],
      presences,
    });

    alert("Présences enregistrées");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">📋 Appel — Classe {classe}</h3>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th>Élève</th>
            <th>Statut</th>
            <th>Métier</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {eleves.map((e) => {
            const m = metier[e.id];

            return (
              <tr key={e.id}>
                <td className="p-2 border">
                  {e.prenom} {e.nom}
                </td>

                <td className="p-2 border">
                  <select                    aria-label={`Statut de présence pour ${e.prenom} ${e.nom}`}                    value={
                      presences.find((p) => p.eleveId === e.id)?.statut || "present"
                    }
                    onChange={(ev) =>
                      updatePresence(e.id, ev.target.value)
                    }
                  >
                    <option value="present">Présent</option>
                    <option value="absent">Absent</option>
                    <option value="retard">Retard</option>
                  </select>
                </td>

                <td className="p-2 border">
                  {m?.statutMetier === "banni" && (
                    <span className="text-red-600">🚫 Banni</span>
                  )}
                  {m?.statutMetier === "essai" && (
                    <span className="text-orange-600">🧪 Essai</span>
                  )}
                  {m?.statutMetier === "a_renvoyer" && (
                    <span className="text-red-600">💰 Paiement requis</span>
                  )}
                  {m?.statutMetier === "autorise" && (
                    <span className="text-green-600">✅ Autorisé</span>
                  )}
                </td>

                <td className="p-2 border">
                  {m?.statutMetier === "a_renvoyer" && (
                    <button
                      onClick={() => handleExclude(e.id)}
                      className="text-red-600 underline"
                    >
                      Exclure
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={handleSave}
        className="bg-black text-white px-4 py-2 rounded"
      >
        💾 Enregistrer l'appel
      </button>
    </div>
  );
}
