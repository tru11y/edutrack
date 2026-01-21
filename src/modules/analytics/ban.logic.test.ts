import { doitBannirEleve } from "./ban.logic";

describe("doitBannirEleve", () => {
  test("avant le 10 → jamais banni", () => {
    const result = doitBannirEleve({
      moisActuel: "2026-01",
      paiementMois: null,
      jour: 5,
    });

    expect(result).toBe(false);
  });

  test("après le 10 sans paiement → banni", () => {
    const result = doitBannirEleve({
      moisActuel: "2026-01",
      paiementMois: null,
      jour: 15,
    });

    expect(result).toBe(true);
  });

  test("après le 10 avec paiement du bon mois → pas banni", () => {
    const result = doitBannirEleve({
      moisActuel: "2026-01",
      paiementMois: { mois: "2026-01" },
      jour: 15,
    });

    expect(result).toBe(false);
  });

  test("après le 10 avec paiement ancien mois → banni", () => {
    const result = doitBannirEleve({
      moisActuel: "2026-01",
      paiementMois: { mois: "2025-12" },
      jour: 15,
    });

    expect(result).toBe(true);
  });
});
