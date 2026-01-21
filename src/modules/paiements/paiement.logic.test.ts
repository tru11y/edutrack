import { calculerPaiement } from "./paiement.logic";

describe("calculerPaiement", () => {
  test("paiement complet", () => {
    const result = calculerPaiement(10000, 10000);
    expect(result.statut).toBe("paye");
    expect(result.montantRestant).toBe(0);
  });

  test("paiement partiel", () => {
    const result = calculerPaiement(10000, 4000);
    expect(result.statut).toBe("partiel");
    expect(result.montantRestant).toBe(6000);
  });

  test("aucun paiement", () => {
    const result = calculerPaiement(10000, 0);
    expect(result.statut).toBe("impaye");
    expect(result.montantRestant).toBe(10000);
  });

  test("surpaiement", () => {
    const result = calculerPaiement(10000, 12000);
    expect(result.statut).toBe("paye");
    expect(result.montantRestant).toBe(0);
  });
});
