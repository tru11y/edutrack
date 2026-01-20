import { Link, useLocation } from "react-router-dom";

const linkClass = (active: boolean) =>
  `block px-4 py-2 rounded ${
    active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
  }`;

export default function Sidebar({
  title,
  links,
}: {
  title: string;
  links: { to: string; label: string }[];
}) {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 bg-white border-r p-4 space-y-4">
      <h1 className="text-lg font-bold">{title}</h1>

      <nav className="space-y-1">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={linkClass(pathname.startsWith(l.to))}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
