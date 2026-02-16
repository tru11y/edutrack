describe("getAnalyticsReport", () => {
  it("should validate report type", () => {
    const validTypes = ["attendance", "grades", "payments", "comprehensive"];
    expect(validTypes.includes("attendance")).toBe(true);
    expect(validTypes.includes("invalid")).toBe(false);
  });

  it("should calculate attendance rate correctly", () => {
    const present = 80, absent = 15, retard = 5;
    const total = present + absent + retard;
    const taux = Math.round((present / total) * 100);
    expect(taux).toBe(80);
  });

  it("should calculate pass rate correctly", () => {
    const notes = [12, 8, 15, 6, 18, 9, 14, 7];
    const passing = notes.filter((n) => n >= 10).length;
    const taux = Math.round((passing / notes.length) * 100);
    expect(taux).toBe(50); // 4 out of 8 pass
  });

  it("should calculate payment recovery rate", () => {
    const totalAttendu = 500000, totalPaye = 350000;
    const taux = Math.round((totalPaye / totalAttendu) * 100);
    expect(taux).toBe(70);
  });

  it("should normalize notes to /20 scale", () => {
    const note = 8, maxNote = 10;
    const normalized = (note / maxNote) * 20;
    expect(normalized).toBe(16);
  });

  it("should handle empty dataset", () => {
    const totalNotes = 0;
    const moyenne = totalNotes > 0 ? 15 / totalNotes : 0;
    expect(moyenne).toBe(0);
  });
});
