import type { ReactNode } from "react";

function Card({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

export default function AdminDashboardUX() {
  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">🎓 Administration</h1>
        <p className="text-gray-500">Vue générale de l’école</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Élèves" value={124} />
        <Card title="Professeurs" value={18} />
        <Card title="Classes" value={9} />
      </div>

      {/* SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">📘 Activité récente</h3>
          <ul className="text-sm space-y-2 text-gray-700">
            <li>• Appel effectué – 3e A</li>
            <li>• Paiement reçu – Janvier</li>
            <li>• Cahier signé – Mathématiques</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">⚠️ Alertes</h3>
          <ul className="text-sm space-y-2 text-gray-700">
            <li>• 2 élèves bannis</li>
            <li>• 1 paiement en retard</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
