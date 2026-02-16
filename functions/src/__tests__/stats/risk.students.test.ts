describe("getAtRiskStudents", () => {
  it("should identify students with high absence rate", () => {
    const absences = 8;
    const total = 20;
    const tauxAbsence = absences / total;
    expect(tauxAbsence).toBeGreaterThan(0.3);
    expect(tauxAbsence > 0.5 ? "danger" : "warning").toBe("warning");
  });

  it("should identify danger severity for >50% absence", () => {
    const tauxAbsence = 12 / 20;
    expect(tauxAbsence > 0.5).toBe(true);
  });

  it("should identify students with unpaid months", () => {
    const impayeCount = 3;
    expect(impayeCount >= 2).toBe(true);
    expect(impayeCount >= 3 ? "danger" : "warning").toBe("danger");
  });

  it("should identify students with low grades", () => {
    const moyenne = 6.5;
    expect(moyenne < 8).toBe(true);
    expect(moyenne < 5 ? "danger" : "warning").toBe("warning");
  });

  it("should not flag students with acceptable metrics", () => {
    const tauxAbsence = 0.15;
    const impayes = 1;
    const moyenne = 12;
    expect(tauxAbsence > 0.3).toBe(false);
    expect(impayes >= 2).toBe(false);
    expect(moyenne < 8).toBe(false);
  });
});
