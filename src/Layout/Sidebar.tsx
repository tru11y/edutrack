import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  const { pathname } = useLocation();
  const { colors } = useTheme();

  return (
    <aside
      className="w-64 p-4 space-y-4"
      style={{
        background: colors.bgCard,
        borderRight: `1px solid ${colors.border}`,
      }}
    >
      <h1 className="text-lg font-bold" style={{ color: colors.text }}>
        {title}
      </h1>

      <nav className="space-y-1">
        {links.map((l) => {
          const isActive = pathname.startsWith(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              className="block px-4 py-2 rounded"
              style={{
                background: isActive ? colors.primary : "transparent",
                color: isActive ? "#fff" : colors.textSecondary,
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
