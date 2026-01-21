import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEleveById } from "./eleve.service";

export default function EleveProfile() {
  const { id } = useParams<{ id: string }>();

  const [eleve, setEleve] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    getEleveById(id)
      .then((data) => {
        if (!data) {
          setError("Élève introuvable");
        } else {
          setEleve(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur lors du chargement");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!eleve) return <div className="p-6 text-red-600">Élève introuvable</div>;

  return (
    <div className="p-6 max-w-3xl space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            👨‍🎓 {eleve.prenom} {eleve.nom}
          </h1>
          <p className="text-gray-500">
            Classe : {eleve.classe}
          </p>
        </div>

        {eleve.isBanned && (
          <span className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm font-semibold">
            🚫 Banni
          </span>
        )}
      </div>

      {/* INFOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Info label="Nom" value={eleve.nom} />
        <Info label="Prénom" value={eleve.prenom} />
        <Info label="Sexe" value={eleve.sexe} />
        <Info label="Classe" value={eleve.classe} />
        <Info label="Statut" value={eleve.statut} />
        <Info label="École d’origine" value={eleve.ecoleOrigine || "—"} />

      </div>

      {/* ACTIONS */}
      <div className="flex gap-4">

        <Link
          to={`/admin/eleves/${eleve.id}/paiements`}
          className="px-4 py-2 rounded bg-black text-white"
        >
          💰 Paiements
        </Link>

        <Link
          to={`/admin/eleves`}
          className="px-4 py-2 rounded border"
        >
          ⬅ Retour
        </Link>

      </div>

      {/* BANNISSEMENT */}
      {eleve.isBanned && (
        <div className="p-4 rounded bg-red-50 border border-red-200">
          <p className="text-red-700 font-semibold">
            Élève suspendu
          </p>
          <p className="text-sm text-red-600">
            Raison : {eleve.banReason || "—"}
          </p>
        </div>
      )}

    </div>
  );
}

/* ======================
   UI COMPONENT
====================== */

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-4 rounded border bg-white">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}
