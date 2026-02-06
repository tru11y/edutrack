import { useSearchParams, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PresenceAppel from "../presences/PresenceAppel";
import CreateCahierTexte from "../cahier/CreateCahierTexte";
import ExclureEleve from "../discipline/ExclureEleve";
import { getCoursById } from "../cours/cours.service";
import { useTheme } from "../../context/ThemeContext";
import type { Cours } from "../cours/cours.types";

export default function ProfCoursDetail() {
  const { colors } = useTheme();
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
    return <div className="p-6" style={{ color: colors.danger }}>Cours introuvable</div>;
  }

  if (!cours) {
    return <div className="p-6" style={{ color: colors.textMuted }}>Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      {/* TITRE */}
      <h1 className="text-xl font-bold" style={{ color: colors.text }}>📚 Gestion du cours</h1>

      {/* MENU ONGLET */}
      <div className="flex gap-3 pb-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <TabLink to={`/prof/cours/${id}?tab=appel`} active={tab === "appel"} colors={colors}>
          Appel
        </TabLink>

        <TabLink to={`/prof/cours/${id}?tab=cahier`} active={tab === "cahier"} colors={colors}>
          Cahier
        </TabLink>

        <TabLink
          to={`/prof/cours/${id}?tab=exclusion`}
          active={tab === "exclusion"}
          colors={colors}
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
  colors,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
  colors: ReturnType<typeof import("../../context/ThemeContext").useTheme>["colors"];
}) {
  return (
    <Link
      to={to}
      className="px-4 py-2 rounded-t-md text-sm font-medium transition"
      style={{
        background: active ? colors.text : colors.bgSecondary,
        color: active ? colors.bg : colors.textMuted
      }}
    >
      {children}
    </Link>
  );
}
