import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Page from "../components/layout/Page";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";

import { getPaiementStats } from "../modules/paiements/paiement.stats";
import { getElevesARisque } from "../modules/analytics/risk.service";

type DashboardStats = {
  totalEncaisse: number;
  totalAttendu: number;
  totalImpayes: number;
  nombrePaiements: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [elevesARisque, setElevesARisque] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [paiements, risques] = await Promise.all([
        getPaiementStats(),
        getElevesARisque(),
      ]);

      setStats(paiements);
      setElevesARisque(risques);
      setLoading(false);
    };

    load();
  }, []);

  if (loading || !stats) {
    return <Page>Chargement…</Page>;
  }

  return (
    <Page>
      <PageHeader
        title="Dashboard Admin"
        subtitle="Supervision financière, élèves et opérations"
      />

      {/* ====== STATS FINANCIÈRES ====== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          marginTop: 24,
        }}
      >
        <Card>
          <p className="muted">💰 Encaissé</p>
          <h2>{stats.totalEncaisse.toLocaleString()} FCFA</h2>
        </Card>

        <Card>
          <p className="muted">📊 Attendu</p>
          <h2>{stats.totalAttendu.toLocaleString()} FCFA</h2>
        </Card>

        <Card>
          <p className="muted">🔴 Impayés</p>
          <h2 style={{ color: "var(--danger)" }}>
            {stats.totalImpayes.toLocaleString()} FCFA
          </h2>
        </Card>

        <Card>
          <p className="muted">📄 Paiements</p>
          <h2>{stats.nombrePaiements}</h2>
        </Card>
      </div>

      {/* ====== ÉLÈVES À RISQUE ====== */}
      <div style={{ marginTop: 40 }}>
        <h2 className="text-lg font-semibold mb-3">⚠️ Élèves à risque</h2>

        {elevesARisque.length === 0 ? (
          <p className="muted">Aucun élève à risque actuellement</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Élève</th>
                <th className="border p-2">Classe</th>
                <th className="border p-2">Risque</th>
                <th className="border p-2"></th>
              </tr>
            </thead>
            <tbody>
              {elevesARisque.map((e) => (
                <tr key={e.id}>
                  <td className="border p-2">
                    {e.prenom} {e.nom}
                  </td>
                  <td className="border p-2">{e.classe}</td>
                  <td className="border p-2 text-red-600">
                    {e.reason}
                  </td>
                  <td className="border p-2">
                    <Link
                      to={`/admin/eleves/${e.id}`}
                      className="text-blue-600 underline"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Page>
  );
}
