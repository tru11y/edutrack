export default function EleveDashboardUX() {
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">🎒 Mon espace élève</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">📅 Aujourd’hui</h3>
          <ul className="space-y-2 text-sm">
            <li>• 08h – Mathématiques</li>
            <li>• 10h – Français</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">💰 Paiements</h3>
          <p className="text-sm text-gray-700">
            Statut : <span className="text-green-600 font-semibold">À jour</span>
          </p>
        </div>

      </div>

    </div>
  );
}
