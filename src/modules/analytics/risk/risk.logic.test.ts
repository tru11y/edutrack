import { calculerRisque } from "./risk.logic";

describe("calculerRisque", () => {
  it("retourne faible pour élève sans problème", () => {
    const r = calculerRisque({
      absences: 0,
      retards: 1,
      exclusions: 0,
      paiementsEnRetard: 0,
    });

    expect(r.level).toBe("faible");
    expect(r.score).toBeLessThan(7);
  });

  it("retourne moyen pour élève instable", () => {
    const r = calculerRisque({
      absences: 2,
      retards: 2,
      exclusions: 0,
      paiementsEnRetard: 1,
    });

    expect(r.level).toBe("moyen");
    expect(r.score).toBeGreaterThanOrEqual(7);
  });

  it("retourne eleve pour élève critique", () => {
    const r = calculerRisque({
      absences: 4,
      retards: 3,
      exclusions: 2,
      paiementsEnRetard: 2,
    });

    expect(r.level).toBe("eleve");
    expect(r.score).toBeGreaterThanOrEqual(15);
  });
});
