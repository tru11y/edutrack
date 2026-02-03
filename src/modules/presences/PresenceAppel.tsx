import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";

import { getAllEleves } from "../eleves/eleve.service";
import { getElevesEligibles } from "../eleves/eleve.select.service";

import { savePresencesForCours, getPresencesByCours } from "./presence.service";
import { createCahierEntry } from "../cahier/cahier.service";
import { banEleveByProf } from "../eleves/eleve.ban.service";

import type { PresenceItem } from "./presence.types";

interface Props {
  coursId: string;
  classe: string;
  date: string;
  heureDebut: string;
  heureFin: string;
}

export default function PresenceAppel({ coursId, classe, date, heureDebut, heureFin }: Props) {
  const { user } = useAuth();

  const [eleves, setEleves] = useState<any[]>([]);
  const [presences, setPresences] = useState<PresenceItem[]>([]);
  const [allEleves, setAllEleves] = useState<any[]>([]);

  const [selectedEleveId, setSelectedEleveId] = useState("");
  const [contenu, setContenu] = useState("");
  const [devoirs, setDevoirs] = useState("");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Modifiable pendant la durée du cours : heureDebut <= now <= heureFin
  const { isLocked, status } = useMemo(() => {
    if (!date || !heureDebut || !heureFin) {
      return { isLocked: false, status: "no-data" };
    }

    const now = new Date();
    const coursStart = new Date(`${date}T${heureDebut}:00`);
    const coursEnd = new Date(`${date}T${heureFin}:00`);

    if (isNaN(coursStart.getTime()) || isNaN(coursEnd.getTime())) {
      return { isLocked: false, status: "invalid-date" };
    }

    if (now < coursStart) {
      return { isLocked: true, status: "not-started" };
    }

    if (now > coursEnd) {
      return { isLocked: true, status: "ended" };
    }

    return { isLocked: false, status: "in-progress" };
  }, [date, heureDebut, heureFin]);

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);

      // 1. Charger les élèves de la classe
      const allElevesData = await getAllEleves();
      const filtres = allElevesData.filter(
        (e) => e.classe === classe && !e.isBanned
      );
      setEleves(filtres);

      // 2. Charger les présences existantes
      const existingPresences = await getPresencesByCours(coursId);
      const latestPresence = existingPresences.length > 0
        ? existingPresences[existingPresences.length - 1]
        : null;

      // 3. Initialiser les présences
      if (latestPresence?.presences) {
        const existingMap = new Map(
          latestPresence.presences.map((p: PresenceItem) => [p.eleveId, p])
        );

        const merged = filtres.map((e) => {
          const id = e.id ?? "";
          const existing = existingMap.get(id);
          if (existing) {
            return existing;
          }
          return {
            eleveId: id,
            statut: "present" as const,
            facturable: true,
            statutMetier: "autorise" as const,
            message: "",
          };
        });

        setPresences(merged);
      } else {
        setPresences(
          filtres.map((e) => ({
            eleveId: e.id ?? "",
            statut: "present" as const,
            facturable: true,
            statutMetier: "autorise" as const,
            message: "",
          }))
        );
      }

      // 4. Charger tous les élèves pour l'ajout manuel
      const eligibles = await getElevesEligibles();
      setAllEleves(eligibles);

      setInitialLoading(false);
    };

    loadData();
  }, [coursId, classe]);

  const _updatePresence = (
    eleveId: string,
    statut: "present" | "absent" | "retard",
    minutesRetard = 0
  ) => {
    if (isLocked) return;

    setPresences((prev) =>
      prev.map((p) =>
        p.eleveId === eleveId
          ? { ...p, statut, minutesRetard }
          : p
      )
    );
  };

  const _handleExclude = async (eleveId: string) => {
    if (isLocked) return;

    const confirm = window.confirm(
      "Exclure cet élève pour non paiement ?"
    );

    if (!confirm) return;

    await banEleveByProf(eleveId, "Non paiement");

    setEleves((prev) => prev.filter((e) => e.id !== eleveId));
    setPresences((prev) => prev.filter((p) => p.eleveId !== eleveId));

    alert("Élève exclu et signalé à l'administration");
  };

  const handleAddEleve = () => {
    if (isLocked) return;
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
        statut: "present" as const,
        facturable: true,
        statutMetier: "autorise" as const,
        message: "",
      },
    ]);

    setSelectedEleveId("");
  };

  const handleSave = async () => {
    if (isLocked) {
      alert("L'appel ne peut être modifié que pendant la durée du cours.");
      return;
    }

    setLoading(true);

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

  if (initialLoading) {
    return <div className="p-4 text-gray-500">Chargement...</div>;
  }

  const statusMessage = {
    "not-started": "⏳ Le cours n'a pas encore commencé",
    "ended": "🔒 Cours terminé — lecture seule",
    "in-progress": "✅ Appel en cours",
  }[status] || "";

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">📋 Appel & Cahier de texte</h3>
        {statusMessage && (
          <span className={`text-sm font-medium ${
            status === "in-progress" ? "text-green-600" : "text-red-600"
          }`}>
            {statusMessage}
          </span>
        )}
      </div>

      {/* CONTENU DU COURS */}
      <div className="space-y-2">
        <textarea
          placeholder="Contenu du cours (obligatoire)"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          className="w-full border p-2 rounded"
          rows={4}
          disabled={isLocked}
        />

        <textarea
          placeholder="Devoirs (optionnel)"
          value={devoirs}
          onChange={(e) => setDevoirs(e.target.value)}
          className="w-full border p-2 rounded"
          rows={3}
          disabled={isLocked}
        />
      </div>

      {/* AJOUT MANUEL */}
      {!isLocked && (
        <div className="flex gap-2">
          <select
            value={selectedEleveId}
            onChange={(e) => setSelectedEleveId(e.target.value)}
            className="border p-2 rounded w-64"
            aria-label="Sélectionner un élève à ajouter"
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
      )}

      {/* TABLE */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Élève</th>
            <th className="border p-2">Présent</th>
            <th className="border p-2">Absent</th>
            <th className="border p-2">Retard</th>
            <th className="border p-2">Minutes</th>
            {!isLocked && <th className="border p-2">Action</th>}
          </tr>
        </thead>
        <tbody>
        {presences.map((presence) => {
          const eleve = eleves.find(e => e.id === presence.eleveId);
          if (!eleve) return null;

          return (
            <tr key={presence.eleveId}>
              <td className="border p-2">{eleve.prenom} {eleve.nom}</td>
              <td className="border p-2 text-center">
                <input
                  type="radio"
                  name={`statut-${presence.eleveId}`}
                  checked={presence.statut === "present"}
                  onChange={() => _updatePresence(presence.eleveId, "present")}
                  disabled={isLocked}
                />
              </td>
              <td className="border p-2 text-center">
                <input
                  type="radio"
                  name={`statut-${presence.eleveId}`}
                  checked={presence.statut === "absent"}
                  onChange={() => _updatePresence(presence.eleveId, "absent")}
                  disabled={isLocked}
                />
              </td>
              <td className="border p-2 text-center">
                <input
                  type="radio"
                  name={`statut-${presence.eleveId}`}
                  checked={presence.statut === "retard"}
                  onChange={() => _updatePresence(presence.eleveId, "retard")}
                  disabled={isLocked}
                />
              </td>
              <td className="border p-2">
                {presence.statut === "retard" && (
                  <input
                    type="number"
                    min="0"
                    value={presence.minutesRetard || 0}
                    onChange={(e) => _updatePresence(presence.eleveId, "retard", parseInt(e.target.value))}
                    className="border p-1 rounded w-16"
                    disabled={isLocked}
                  />
                )}
              </td>
              {!isLocked && (
                <td className="border p-2">
                  <button
                    onClick={() => _handleExclude(presence.eleveId)}
                    className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                  >
                    Exclure
                  </button>
                </td>
              )}
            </tr>
          );
        })}
        </tbody>
      </table>

      {!isLocked && (
        <button
          onClick={handleSave}
          disabled={loading || !contenu.trim()}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading
            ? "Enregistrement…"
            : "💾 Enregistrer appel + cahier"}
        </button>
      )}

    </div>
  );
}
