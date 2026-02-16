describe("paiements stats calculations", () => {
  it("should calculate coverage rate", () => {
    const totalRecus = 350000;
    const totalAttendus = 500000;
    const taux = totalAttendus > 0 ? Math.round((totalRecus / totalAttendus) * 100) : 0;
    expect(taux).toBe(70);
  });

  it("should handle zero total", () => {
    const totalAttendus = 0;
    const taux = totalAttendus > 0 ? Math.round((100 / totalAttendus) * 100) : 0;
    expect(taux).toBe(0);
  });

  it("should aggregate monthly stats", () => {
    const paiements = [
      { mois: "2024-01", montantTotal: 50000, montantPaye: 50000 },
      { mois: "2024-01", montantTotal: 50000, montantPaye: 30000 },
      { mois: "2024-02", montantTotal: 50000, montantPaye: 0 },
    ];

    const byMonth: Record<string, { total: number; paye: number }> = {};
    for (const p of paiements) {
      if (!byMonth[p.mois]) byMonth[p.mois] = { total: 0, paye: 0 };
      byMonth[p.mois].total += p.montantTotal;
      byMonth[p.mois].paye += p.montantPaye;
    }

    expect(byMonth["2024-01"].total).toBe(100000);
    expect(byMonth["2024-01"].paye).toBe(80000);
    expect(byMonth["2024-02"].total).toBe(50000);
    expect(byMonth["2024-02"].paye).toBe(0);
  });

  it("should count unpaid months per student", () => {
    const paiements = [
      { eleveId: "e1", statut: "paye" },
      { eleveId: "e1", statut: "impaye" },
      { eleveId: "e1", statut: "impaye" },
      { eleveId: "e2", statut: "paye" },
    ];

    const impayesCount = paiements.filter((p) => p.eleveId === "e1" && p.statut === "impaye").length;
    expect(impayesCount).toBe(2);
  });
});
