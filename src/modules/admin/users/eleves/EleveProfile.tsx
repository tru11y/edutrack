import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getEleveById } from "./eleve.service";
import type { Eleve } from "./eleve.types";
import { logger } from "@/utils/logger";

export default function EleveProfile() {
  const { id } = useParams();
  const [eleve, setEleve] = useState<Eleve | null>(null);

  useEffect(() => {
    if (id) getEleveById(id).then(setEleve).catch(logger.error);
  }, [id]);

  if (!eleve) return <div>Chargement...</div>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">👤 {eleve.nom} {eleve.prenom}</h2>

      <p><b>Matricule :</b> {eleve.matricule}</p>
      <p><b>Classe :</b> {eleve.classe}</p>
      <p><b>Téléphone :</b> {eleve.telephone}</p>
      <p><b>Parent :</b> {eleve.parentNom} ({eleve.parentTelephone})</p>
      <p><b>Statut :</b> {eleve.statut}</p>
    </div>
  );
}
