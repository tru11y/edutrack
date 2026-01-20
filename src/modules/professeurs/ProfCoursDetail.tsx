import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCahierByCours, signCahierEntry } from "../cahier/cahier.service";
import { useAuth } from "../../context/AuthContext";

export default function ProfCoursDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    getCahierByCours(id)
      .then(setEntries)
      .catch(() => setError("Impossible de charger le cahier"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSign = async (entryId: string) => {
    if (!user?.professeurId) return;

    try {
      await signCahierEntry(entryId, user.professeurId);
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, isSigned: true } : e
        )
      );
      alert("Cahier signé");
    } catch (e: any) {
      alert(e.message || "Erreur signature");
    }
  };

  if (loading) return <div className="p-6">Chargement…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">📘 Cahier de texte</h1>

      {entries.length === 0 && (
        <p className="text-gray-500">Aucune entrée</p>
      )}

      {entries.map((e) => (
        <div
          key={e.id}
          className="border rounded p-4 bg-white space-y-2"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                {e.date} — {e.classe}
              </p>
              <p className="font-semibold">{e.contenu}</p>
            </div>

            {!e.isSigned ? (
              <button
                onClick={() => handleSign(e.id)}
                className="bg-black text-white px-3 py-1 rounded text-sm"
              >
                ✍️ Signer
              </button>
            ) : (
              <span className="text-green-600 text-sm font-semibold">
                ✔ Signé
              </span>
            )}
          </div>

          {e.devoirs && (
            <p className="text-sm text-gray-700">
              <b>Devoirs :</b> {e.devoirs}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
