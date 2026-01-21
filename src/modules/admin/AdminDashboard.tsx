import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Link } from "react-router-dom";

type Stats = {
  eleves: number;
  profs: number;
  cours: number;
  bannis: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    eleves: 0,
    profs: 0,
    cours: 0,
    bannis: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const elevesSnap = await getDocs(collection(db, "eleves"));
      const profsSnap = await getDocs(collection(db, "professeurs"));
      const coursSnap = await getDocs(collection(db, "cours"));

      const eleves = elevesSnap.docs.map((d) => d.data());
      const profs = profsSnap.docs.map((d) => d.data());
      const cours = coursSnap.docs.map((d) => d.data());

      const bannis = eleves.filter((e: any) => e.isBanned).length;

      setStats({
        eleves: eleves.length,
        profs: profs.length,
        cours: cours.length,
        bannis,
      });

      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Chargement…</div>;
  }

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">🎓 EDUTRACK — Administration</h1>
        <p className="text-gray-500">Vue d’ensemble de l’établissement</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Élèves" value={stats.eleves} />
        <StatCard label="Professeurs" value={stats.profs} />
        <StatCard label="Cours" value={stats.cours} />
        <StatCard label="Bannis" value={stats.bannis} alert />
      </div>

      {/* ACTIONS RAPIDES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction title="➕ Ajouter un élève" desc="Créer un nouveau compte élève" to="/admin/eleves/create" />
        <QuickAction title="👨‍🏫 Ajouter un professeur" desc="Créer un compte professeur" to="/admin/professeurs/create" />
        <QuickAction title="📘 Créer un cours" desc="Planifier un nouveau cours" to="/admin/cours/create" />
        <QuickAction title="🚫 Élèves bannis" desc="Voir et débannir" to="/admin/bans" danger />
        <QuickAction title="💰 Paiements" desc="Suivi financier" to="/admin/paiements" />
        <QuickAction title="📓 Cahier de texte" desc="Historique des cours" to="/admin/cahier" />
      </div>

    </div>
  );
}

/* ================= UI ================= */

function StatCard({
  label,
  value,
  alert,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl shadow p-5 border ${
        alert ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${alert ? "text-red-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  title,
  desc,
  to,
  danger,
}: {
  title: string;
  desc: string;
  to: string;
  danger?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-xl border shadow p-5 hover:shadow-lg transition ${
        danger ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <h3 className={`font-semibold ${danger ? "text-red-700" : ""}`}>
        {title}
      </h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}
