import { useSearchParams, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PresenceAppel from "../presences/PresenceAppel";
import CreateCahierTexte from "../cahier/CreateCahierTexte";
import ExclureEleve from "../discipline/ExclureEleve";
import { getCoursById } from "../cours/cours.service";
import type { Cours } from "../cours/cours.types";

export default function ProfCoursDetail() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const [cours, setCours] = useState<Cours | null>(null);

  const tab = params.get("tab") || "appel";

  useEffect(() => {
    if (id) {
      getCoursById(id).then(setCours);
    }
  }, [id]);

  if (!id) {
    return <div className="p-6 text-red-600">Cours introuvable</div>;
  }

  if (!cours) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      {/* TITRE */}
      <h1 className="text-xl font-bold">📚 Gestion du cours</h1>

      {/* MENU ONGLET */}
      <div className="flex gap-3 border-b pb-3">
        <TabLink to={`/prof/cours/${id}?tab=appel`} active={tab === "appel"}>
          Appel
        </TabLink>

        <TabLink to={`/prof/cours/${id}?tab=cahier`} active={tab === "cahier"}>
          Cahier
        </TabLink>

        <TabLink
          to={`/prof/cours/${id}?tab=exclusion`}
          active={tab === "exclusion"}
        >
          Exclusion
        </TabLink>
      </div>

      {/* CONTENU */}
      {tab === "appel" && (
        <PresenceAppel
          coursId={id}
          classe={cours.classe}
          date={cours.date}
          heureDebut={cours.heureDebut}
          heureFin={cours.heureFin}
        />
      )}
      {tab === "cahier" && <CreateCahierTexte coursId={id} classe={cours.classe} elevesPresents={[]} />}
      {tab === "exclusion" && <ExclureEleve />}

    </div>
  );
}

/* =========================
   UI TAB
========================= */

function TabLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-t-md text-sm font-medium transition ${
        active
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}
