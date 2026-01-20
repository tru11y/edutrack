import { useAuth } from "../../context/AuthContext";

export default function ParentDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">👪 Espace Parent</h1>

      <p className="text-gray-600">
        Bienvenue {user?.email}. Vous pouvez suivre la scolarité de votre enfant ici.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          📋 Suivi des présences
        </div>

        <div className="bg-white p-4 rounded shadow">
          📘 Cahier de texte
        </div>

        <div className="bg-white p-4 rounded shadow">
          💰 Paiements & reçus
        </div>
      </div>
    </div>
  );
}
