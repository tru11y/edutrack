import { describe, it, expect } from "vitest";
import { calculerPaiement } from "./paiement.logic";

describe("calculerPaiement", () => {
  it("doit marquer payé si montant exact", () => {
    const res = calculerPaiement(10000, 10000);
    expect(res.statut).toBe("paye");
    expect(res.montantRestant).toBe(0);
  });

  it("doit marquer partiel si insuffisant", () => {
    const res = calculerPaiement(10000, 6000);
    expect(res.statut).toBe("partiel");
    expect(res.montantRestant).toBe(4000);
  });

  it("doit marquer impayé si zéro", () => {
    const res = calculerPaiement(10000, 0);
    expect(res.statut).toBe("impaye");
    expect(res.montantRestant).toBe(10000);
  });
});
