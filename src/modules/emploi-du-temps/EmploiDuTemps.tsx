import { useEffect, useState } from "react";
import { getCreneaux } from "./emploi.service";
import type { Creneau } from "./emploi.types";
import { logger } from "@/utils/logger";

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function EmploiDuTemps() {
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);

  useEffect(() => {
    getCreneaux().then(setCreneaux).catch(logger.error);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">📅 Emploi du temps</h1>

      {JOURS.map(jour => (
        <div key={jour} className="mb-6">
          <h2 className="font-semibold mb-2">{jour}</h2>

          <div className="bg-white rounded shadow">
            {creneaux
              .filter(c => c.jour === jour)
              .map(c => (
                <div key={c.id} className="border-b p-3">
                  ⏰ {c.heureDebut} - {c.heureFin} |  
                  🎓 {c.classe} |  
                  📘 {c.matiere} |  
                  👨‍🏫 {c.professeurId}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
