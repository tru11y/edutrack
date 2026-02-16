import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const ROUTE_LABELS: Record<string, string> = {
  "": "Accueil",
  "eleves": "Eleves",
  "nouveau": "Nouveau",
  "modifier": "Modifier",
  "classes": "Classes",
  "presences": "Presences",
  "appel": "Appel",
  "paiements": "Paiements",
  "stats": "Statistiques",
  "utilisateurs": "Utilisateurs",
  "messages": "Messages",
  "profil": "Profil",
  "comptabilite": "Comptabilite",
  "emploi-du-temps": "Emploi du temps",
  "evaluations": "Evaluations",
  "nouvelle": "Nouvelle",
  "notes": "Notes",
  "bulletins": "Bulletins",
  "notifications": "Notifications",
  "config": "Configuration",
  "discipline": "Discipline",
  "matieres": "Matieres",
  "import-eleves": "Import eleves",
  "parametres": "Parametres",
  "audit": "Audit",
  "corbeille": "Corbeille",
  "promotion": "Promotion",
  "archives": "Archives",
  "analytics": "Analytics",
  "mes-eleves": "Mes eleves",
};

const Breadcrumb: React.FC = () => {
  const { colors } = useTheme();
  const location = useLocation();

  const pathParts = location.pathname.split("/").filter(Boolean);
  if (pathParts.length <= 1) return null;

  const crumbs = pathParts.map((part, index) => {
    const path = "/" + pathParts.slice(0, index + 1).join("/");
    const label = ROUTE_LABELS[part] || part;
    const isLast = index === pathParts.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 13 }}>
      <Link to="/" style={{ color: colors.textMuted, textDecoration: "none" }}>
        Accueil
      </Link>
      {crumbs.map((crumb) => (
        <React.Fragment key={crumb.path}>
          <span style={{ color: colors.textMuted }}>/</span>
          {crumb.isLast ? (
            <span style={{ color: colors.text, fontWeight: 500 }}>{crumb.label}</span>
          ) : (
            <Link to={crumb.path} style={{ color: colors.textMuted, textDecoration: "none" }}>
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
