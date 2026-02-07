import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { ajouterVersementSecure, getCloudFunctionErrorMessage } from "../../services/cloudFunctions";
import type { Paiement, MethodePaiement } from "./paiement.types";

export default function CreatePaiement({ paiement, onSuccess }: { paiement: Paiement & { id: string }; onSuccess?: () => void }) {
  const { colors } = useTheme();
  const [montant, setMontant] = useState(0);
  const [methode, setMethode] = useState<MethodePaiement>("especes");
  const [datePaiement, setDatePaiement] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montant <= 0) {
      alert("Le montant doit être supérieur à 0");
      return;
    }

    setLoading(true);
    try {
      await ajouterVersementSecure({
        paiementId: paiement.id,
        montant,
        methode,
        datePaiement,
      });

      alert("Paiement enregistré");
      setMontant(0);
      onSuccess?.();
    } catch (error) {
      alert(getCloudFunctionErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: colors.bgSecondary,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
      }}
    >
      <h4 style={{ fontWeight: 600, marginBottom: 12, color: colors.text }}>
        Nouveau versement
      </h4>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>
          Date du paiement
        </label>
        <input
          type="date"
          value={datePaiement}
          onChange={(e) => setDatePaiement(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            fontSize: 14,
            background: colors.bgInput,
            color: colors.text,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>
          Montant
        </label>
        <input
          type="number"
          placeholder="Montant"
          value={montant || ""}
          onChange={(e) => setMontant(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            fontSize: 14,
            background: colors.bgInput,
            color: colors.text,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>
          Méthode
        </label>
        <select
          value={methode}
          onChange={(e) => setMethode(e.target.value as MethodePaiement)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            fontSize: 14,
            background: colors.bgInput,
            color: colors.text,
            boxSizing: "border-box",
          }}
        >
          <option value="especes">Espèces</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="virement">Virement</option>
          <option value="cheque">Chèque</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || montant <= 0}
        style={{
          width: "100%",
          padding: "12px 20px",
          background: colors.primary,
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading || montant <= 0 ? 0.6 : 1,
        }}
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
