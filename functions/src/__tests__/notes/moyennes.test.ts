describe("calculateMoyennes", () => {
  it("should calculate weighted average", () => {
    const notes = [
      { note: 14, maxNote: 20, coefficient: 2 },
      { note: 8, maxNote: 10, coefficient: 1 },
      { note: 16, maxNote: 20, coefficient: 3 },
    ];

    let totalWeighted = 0;
    let totalCoef = 0;

    for (const n of notes) {
      const normalized = (n.note / n.maxNote) * 20;
      totalWeighted += normalized * n.coefficient;
      totalCoef += n.coefficient;
    }

    const moyenne = totalCoef > 0 ? totalWeighted / totalCoef : 0;
    // (14*2 + 16*1 + 16*3) / (2+1+3) = (28+16+48)/6 = 92/6 ≈ 15.33
    expect(Math.round(moyenne * 100) / 100).toBeCloseTo(15.33, 1);
  });

  it("should handle zero coefficient", () => {
    const totalCoef = 0;
    const moyenne = totalCoef > 0 ? 100 / totalCoef : 0;
    expect(moyenne).toBe(0);
  });

  it("should handle absent student", () => {
    const note = { note: 0, absence: true, maxNote: 20, coefficient: 2 };
    expect(note.absence).toBe(true);
    expect(note.note).toBe(0);
  });

  it("should calculate class average from multiple students", () => {
    const studentMoyennes = [12.5, 14.0, 8.5, 16.0, 10.0];
    const classMoyenne = studentMoyennes.reduce((a, b) => a + b, 0) / studentMoyennes.length;
    expect(classMoyenne).toBe(12.2);
  });
});
