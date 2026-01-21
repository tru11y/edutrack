import EleveDashboardUX from "../../components/ux_dashboards_appleSchool/EleveDashboardUX";

export default function EleveDashboard() {
  return (
    <div className="space-y-6">
      <EleveDashboardUX />

      {/* ZONE DONNÉES RÉELLES PLUS TARD */}
      <div className="p-6 bg-white rounded-xl shadow">
        <ul className="space-y-2 text-sm">
          <li>📅 Prochain cours : —</li>
          <li>✅ Taux de présence : —</li>
          <li>💰 Solde : —</li>
        </ul>
      </div>
    </div>
  );
}
