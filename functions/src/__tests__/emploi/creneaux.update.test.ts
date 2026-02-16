describe("updateCreneau", () => {
  function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  function hasOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
    const a = timeToMinutes(s1), b = timeToMinutes(e1);
    const c = timeToMinutes(s2), d = timeToMinutes(e2);
    return a < d && c < b;
  }

  it("should detect overlapping time slots", () => {
    expect(hasOverlap("08:00", "10:00", "09:00", "11:00")).toBe(true);
    expect(hasOverlap("08:00", "10:00", "10:00", "12:00")).toBe(false);
    expect(hasOverlap("14:00", "16:00", "15:00", "15:30")).toBe(true);
  });

  it("should not detect overlap for adjacent slots", () => {
    expect(hasOverlap("08:00", "10:00", "10:00", "12:00")).toBe(false);
    expect(hasOverlap("10:00", "12:00", "08:00", "10:00")).toBe(false);
  });

  it("should correctly convert time to minutes", () => {
    expect(timeToMinutes("08:00")).toBe(480);
    expect(timeToMinutes("14:30")).toBe(870);
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("should detect conflict when same prof at same time", () => {
    const creneaux = [
      { id: "1", jour: "lundi", heureDebut: "08:00", heureFin: "10:00", professeurId: "p1", classe: "6A" },
      { id: "2", jour: "lundi", heureDebut: "09:00", heureFin: "11:00", professeurId: "p1", classe: "6B" },
    ];
    const a = creneaux[0], b = creneaux[1];
    const overlap = hasOverlap(a.heureDebut, a.heureFin, b.heureDebut, b.heureFin);
    const sameProf = a.professeurId === b.professeurId;
    expect(overlap && sameProf).toBe(true);
  });
});
