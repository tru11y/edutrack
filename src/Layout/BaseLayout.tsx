import { Outlet } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function BaseLayout({
  sidebar,
}: {
  sidebar: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <div className="min-h-screen flex" style={{ background: colors.bg }}>
      {sidebar}

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
