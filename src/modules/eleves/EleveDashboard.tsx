import Page from "../../components/layout/Page";
import PageHeader from "../../components/layout/PageHeader";

export default function EleveDashboard() {
  return (
    <Page>
      <PageHeader title="Mon espace" subtitle="Résumé rapide" />

      <ul>
        <li>📅 Prochain cours : —</li>
        <li>✅ Taux de présence : —</li>
        <li>💰 Solde : —</li>
      </ul>
    </Page>
  );
}
