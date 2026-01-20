import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCoursById } from "../cours/cours.service";

export default function ProfCoursDetail() {
  const { id } = useParams();
  const [cours, setCours] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    getCoursById(id).then(setCours);
  }, [id]);

  if (!cours) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{cours.nom}</h1>
      <p className="text-gray-600 mb-4">Classe : {cours.classe}</p>

      <div className="space-x-4">
        <button className="btn-primary">📋 Faire l’appel</button>
        <button className="btn-secondary">👨‍🎓 Voir élèves</button>
      </div>
    </div>
  );
}
