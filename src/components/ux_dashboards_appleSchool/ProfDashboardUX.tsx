export default function ProfDashboardUX() {
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">👨‍🏫 Tableau de bord Professeur</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">📚 Mes cours aujourd’hui</h3>
          <ul className="space-y-2 text-sm">
            <li>• 08h – Mathématiques – 3e A</li>
            <li>• 10h – Physique – 4e B</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">📝 À faire</h3>
          <ul className="space-y-2 text-sm">
            <li>• Faire appel – 3e A</li>
            <li>• Remplir cahier – Physique</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
