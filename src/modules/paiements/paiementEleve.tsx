import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Page from "../../components/layout/Page";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import {
  getPaiementsByEleve,
  createPaiementMensuel,
} from "./paiement.service";

export default function PaiementEleve() {
  const { id } = useParams();
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const mois = new Date().toISOString().slice(0, 7);

  const load = async () => {
    if (id) setPaiements(await getPaiementsByEleve(id));
  };

  useEffect(() => {
    load();
  }, [id]);

  const creer = async () => {
    if (!id) return;
    setLoading(true);
    await createPaiementMensuel({
      eleveId: id,
      eleveNom: "—",
      mois,
      montantTotal: 50000,
      montantPaye: 0,
    });
    await load();
    setLoading(false);
  };

  return (
    <Page>
      <PageHeader
        title="Paiements"
        subtitle="Historique et statut des paiements"
        action={
          <button className="btn" onClick={creer} disabled={loading}>
            {loading ? "Création…" : "Créer paiement du mois"}
          </button>
        }
      />

      <Card>
        <Table>
          <thead>
            <tr>
              <th>Mois</th>
              <th>Total</th>
              <th>Payé</th>
              <th>Reste</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {paiements.map((p) => (
              <tr key={p.id}>
                <td>{p.mois}</td>
                <td>{p.montantTotal}</td>
                <td>{p.montantPaye}</td>
                <td>{p.montantRestant}</td>
                <td>
                  {p.statut === "paye" && <Badge label="Payé" type="success" />}
                  {p.statut === "partiel" && (
                    <Badge label="Partiel" type="warning" />
                  )}
                  {p.statut === "impaye" && (
                    <Badge label="Impayé" type="danger" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </Page>
  );
}
