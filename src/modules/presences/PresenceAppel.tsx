import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import { getAllEleves } from "../eleves/eleve.service";
import { getElevesEligibles } from "../eleves/eleve.select.service";

import { getPresencesByCours } from "./presence.service";
import { marquerPresenceBatchSecure } from "../../services/cloudFunctions";
import { createCahierEntry } from "../cahier/cahier.service";
import { banEleveByProf } from "../eleves/eleve.ban.service";

import type { PresenceItem } from "./presence.types";
import type { Eleve } from "../eleves/eleve.types";

interface Props {
  coursId: string;
  classe: string;
  date: string;
  heureDebut: string;
  heureFin: string;
}

type LockStatus = "not-started" | "in-progress" | "grace-period" | "ended" | "invalid-date" | "no-data";

const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes après la fin du cours

function computeLockStatus(date: string, heureDebut: string, heureFin: string): { isLocked: boolean; status: LockStatus } {
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
    // Période de grâce de 15 min après la fin pour ajouter retardataires
    if (now.getTime() <= coursEnd.getTime() + GRACE_PERIOD_MS) {
      return { isLocked: false, status: "grace-period" };
    }
    return { isLocked: true, status: "ended" };
  }

  return { isLocked: false, status: "in-progress" };
}

export default function PresenceAppel({ coursId, classe, date, heureDebut, heureFin }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [presences, setPresences] = useState<PresenceItem[]>([]);
  const [allEleves, setAllEleves] = useState<Eleve[]>([]);

  const [selectedEleveId, setSelectedEleveId] = useState("");
  const [contenu, setContenu] = useState("");
  const [devoirs, setDevoirs] = useState("");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // État temps réel du verrouillage
  const [lockState, setLockState] = useState(() => computeLockStatus(date, heureDebut, heureFin));
  const { isLocked, status } = lockState;

  // Mise à jour en temps réel du statut de verrouillage
  useEffect(() => {
    const updateLock = () => {
      setLockState(computeLockStatus(date, heureDebut, heureFin));
    };

    updateLock();
    const interval = setInterval(updateLock, 10000); // Vérifier toutes les 10 secondes

    return () => clearInterval(interval);
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
        eleveId: eleve.id!,
        statut: "present" as const,
        facturable: true,
        statutMetier: "autorise" as const,
        message: "",
      },
    ]);

    setSelectedEleveId("");
  };

  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    if (isLocked) {
      alert("L'appel ne peut plus être modifié (délai de 15 min après la fin dépassé).");
      return;
    }

    setLoading(true);
    setSaveError("");

    try {
      const presents = presences
        .filter((p) => p.statut === "present" || p.statut === "retard")
        .map((p) => p.eleveId);

      // 1) sauvegarde des présences via Cloud Function
      await marquerPresenceBatchSecure({
        coursId,
        date,
        classe,
        presences: presences.map((p) => ({
          eleveId: p.eleveId,
          statut: p.statut,
          minutesRetard: p.statut === "retard" ? (p.minutesRetard || 0) : undefined,
        })),
      });

      // 2) écriture auto dans le cahier de texte
      await createCahierEntry({
        coursId,
        date,
        classe,
        profId: user!.uid,
        profNom: user?.email?.split("@")[0] || "Professeur",
        eleves: presents,
        contenu: contenu.trim(),
        devoirs: devoirs.trim() || undefined,
      });

      alert("Présences + cahier enregistrés");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setSaveError(message);
      console.error("Erreur sauvegarde appel:", err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-4" style={{ color: colors.textMuted }}>Chargement...</div>;
  }

  const statusMessages: Record<LockStatus, string> = {
    "not-started": "Le cours n'a pas encore commence",
    "grace-period": "Cours termine - vous avez 15 min pour modifier l'appel",
    "ended": "Cours termine - delai de modification depasse",
    "in-progress": "Appel en cours",
    "invalid-date": "Date invalide",
    "no-data": "",
  };
  const statusMessage = statusMessages[status];
  const statusColor = status === "in-progress" ? colors.success
    : status === "grace-period" ? colors.warning
    : colors.danger;

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: colors.text }}>📋 Appel & Cahier de texte</h3>
        {statusMessage && (
          <span
            className="text-sm font-medium"
            style={{ color: statusColor }}
          >
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
          className="w-full p-2 rounded"
          style={{
            background: colors.bgInput,
            border: `1px solid ${colors.border}`,
            color: colors.text
          }}
          rows={4}
          disabled={isLocked}
        />

        <textarea
          placeholder="Devoirs (optionnel)"
          value={devoirs}
          onChange={(e) => setDevoirs(e.target.value)}
          className="w-full p-2 rounded"
          style={{
            background: colors.bgInput,
            border: `1px solid ${colors.border}`,
            color: colors.text
          }}
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
            className="p-2 rounded w-64"
            style={{
              background: colors.bgInput,
              border: `1px solid ${colors.border}`,
              color: colors.text
            }}
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
            className="px-3 py-2 rounded"
            style={{ background: colors.primary, color: colors.onGradient }}
          >
            Ajouter
          </button>
        </div>
      )}

      {/* TABLE */}
      <table className="w-full" style={{ border: `1px solid ${colors.border}` }}>
        <thead style={{ background: colors.bgSecondary }}>
          <tr>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Élève</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Présent</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Absent</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Retard</th>
            <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Minutes</th>
            {!isLocked && <th className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>Action</th>}
          </tr>
        </thead>
        <tbody>
        {presences.map((presence) => {
          const eleve = eleves.find(e => e.id === presence.eleveId);
          if (!eleve) return null;

          return (
            <tr key={presence.eleveId} style={{ background: colors.bgCard }}>
              <td className="p-2" style={{ border: `1px solid ${colors.border}`, color: colors.text }}>{eleve.prenom} {eleve.nom}</td>
              <td className="p-2 text-center" style={{ border: `1px solid ${colors.border}` }}>
                <input
                  type="radio"
                  name={`statut-${presence.eleveId}`}
                  checked={presence.statut === "present"}
                  onChange={() => _updatePresence(presence.eleveId, "present")}
                  disabled={isLocked}
                />
              </td>
              <td className="p-2 text-center" style={{ border: `1px solid ${colors.border}` }}>
                <input
                  type="radio"
                  name={`statut-${presence.eleveId}`}
                  checked={presence.statut === "absent"}
                  onChange={() => _updatePresence(presence.eleveId, "absent")}
                  disabled={isLocked}
                />
              </td>
              <td className="p-2 text-center" style={{ border: `1px solid ${colors.border}` }}>
                <input
                  type="radio"
                  name={`statut-${presence.eleveId}`}
                  checked={presence.statut === "retard"}
                  onChange={() => _updatePresence(presence.eleveId, "retard")}
                  disabled={isLocked}
                />
              </td>
              <td className="p-2" style={{ border: `1px solid ${colors.border}` }}>
                {presence.statut === "retard" && (
                  <input
                    type="number"
                    min="0"
                    value={presence.minutesRetard || 0}
                    onChange={(e) => _updatePresence(presence.eleveId, "retard", parseInt(e.target.value))}
                    className="p-1 rounded w-16"
                    style={{
                      background: colors.bgInput,
                      border: `1px solid ${colors.border}`,
                      color: colors.text
                    }}
                    disabled={isLocked}
                  />
                )}
              </td>
              {!isLocked && (
                <td className="p-2" style={{ border: `1px solid ${colors.border}` }}>
                  <button
                    onClick={() => _handleExclude(presence.eleveId)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: colors.danger, color: colors.onGradient }}
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

      {saveError && (
        <div className="p-3 rounded" style={{ background: colors.dangerBg, border: `1px solid ${colors.danger}40` }}>
          <p className="text-sm" style={{ color: colors.danger, margin: 0 }}>{saveError}</p>
        </div>
      )}

      {!isLocked && (
        <button
          onClick={handleSave}
          disabled={loading || !contenu.trim()}
          className="px-4 py-2 rounded"
          style={{ background: colors.text, color: colors.bg }}
        >
          {loading
            ? "Enregistrement..."
            : "Enregistrer appel + cahier"}
        </button>
      )}

    </div>
  );
}
