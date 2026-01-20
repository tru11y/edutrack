import { Outlet } from "react-router-dom";

export default function ProfesseurLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 font-semibold">
        👨‍🏫 Espace Professeur
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
