import { useEffect, useState } from "react";
import {
  getCahierByClasse,
  getCahierByCours,
} from "./cahier.service";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { exportCahierToPDF } from "./cahier.export";

export default function AdminCahierList() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [classe, setClasse] = useState("");
  const [coursId, setCoursId] = useState("");

  const [classes, setClasses] = useState<string[]>([]);
  const [cours, setCours] = useState<any[]>([]);

  useEffect(() => {
    const loadMeta = async () => {
      const elevesSnap = await getDocs(collection(db, "eleves"));
      const coursSnap = await getDocs(collection(db, "cours"));

      const cls = new Set<string>();
      elevesSnap.forEach((d) => cls.add(d.data().classe));

      setClasses(Array.from(cls));
      setCours(
        coursSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    };

    loadMeta();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      let data: any[] = [];

      if (classe) {
        data = await getCahierByClasse(classe);
      } else if (coursId) {
        data = await getCahierByCours(coursId);
      } else {
        const snap = await getDocs(collection(db, "cahierTexte"));
        data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
      }

      data.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(data);
      setLoading(false);
    };

    load();
  }, [classe, coursId]);

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">📘 Cahier de texte (Admin)</h1>

      {/* FILTRES */}
      <div className="flex gap-4">

        <select
          value={classe}
          onChange={(e) => {
            setClasse(e.target.value);
            setCoursId("");
          }}
          className="border p-2 rounded"
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={coursId}
          onChange={(e) => {
            setCoursId(e.target.value);
            setClasse("");
          }}
          className="border p-2 rounded"
        >
          <option value="">Tous les cours</option>
          {cours.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom} — {c.classe}
            </option>
          ))}
        </select>

      </div>
<button
  onClick={() =>
    exportCahierToPDF(entries, {
      titre: "Cahier de texte – EDUTRACK",
      periode: classe
        ? `Classe : ${classe}`
        : coursId
        ? `Cours : ${coursId}`
        : "",
    })
  }
  className="bg-black text-white px-3 py-2 rounded text-sm"
>
  📄 Exporter PDF
</button>

      {/* LISTE */}
      {entries.length === 0 ? (
        <p className="text-gray-500">Aucune entrée</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Classe</th>
              <th className="border p-2">Cours</th>
              <th className="border p-2">Prof</th>
              <th className="border p-2">Élèves</th>
              <th className="border p-2">Contenu</th>
              <th className="border p-2">Devoirs</th>
            </tr>
          </thead>

          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="border p-2">{e.date}</td>
                <td className="border p-2">{e.classe}</td>
                <td className="border p-2">{e.coursId}</td>
                <td className="border p-2">{e.profId}</td>
                <td className="border p-2 text-sm">
                  {e.eleves?.length || 0}
                </td>
                <td className="border p-2 whitespace-pre-wrap">
                  {e.contenu}
                </td>
                <td className="border p-2 whitespace-pre-wrap">
                  {e.devoirs || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
}
