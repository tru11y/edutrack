import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";

// Fonction d'assignation de professeur - intégrée depuis cours.service
async function assignProfesseurToCours(coursId: string, profId: string) {
  const ref = doc(db, "cours", coursId);
  await updateDoc(ref, { profId });
}

export default function CoursAssignProf() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profs, setProfs] = useState<any[]>([]);
  const [profId, setProfId] = useState("");

  useEffect(() => {
    getDocs(collection(db, "professeurs")).then((snap) => {
      setProfs(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, []);

  const handleAssign = async () => {
    const prof = profs.find((p) => p.id === profId);
    if (!prof || !id) return;

    await assignProfesseurToCours(id, profId);
    navigate("/admin/cours");
  };

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-bold mb-4">👨‍🏫 Assigner un professeur</h1>

      <select
        className="w-full border p-2 mb-4"
        value={profId}
        onChange={(e) => setProfId(e.target.value)}
      >
        <option value="">-- Choisir un professeur --</option>
        {profs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nom}
          </option>
        ))}
      </select>

      <button
        onClick={handleAssign}
        className="bg-black text-white px-4 py-2 rounded w-full"
      >
        Assigner
      </button>
    </div>
  );
}
