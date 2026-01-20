import { Outlet } from "react-router-dom";

export default function BaseLayout({
  sidebar,
}: {
  sidebar: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {sidebar}

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
