import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

type Stats = {
  users: number;
  profs: number;
  eleves: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    profs: 0,
    eleves: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = snap.docs.map((d) => d.data());

        setStats({
          users: users.length,
          profs: users.filter((u: any) => u.role === "prof").length,
          eleves: users.filter((u: any) => u.role === "eleve").length,
        });
      } catch (e) {
        setError("Impossible de charger les statistiques");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Chargement du tableau de bord…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 Tableau de bord Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Utilisateurs"
          value={stats.users}
          color="bg-blue-500"
        />
        <StatCard
          label="Professeurs"
          value={stats.profs}
          color="bg-green-500"
        />
        <StatCard
          label="Élèves"
          value={stats.eleves}
          color="bg-purple-500"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center justify-between">
      <div>
        <p className="text-gray-500">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white text-xl font-bold`}
      >
        {label.charAt(0)}
      </div>
    </div>
  );
}
