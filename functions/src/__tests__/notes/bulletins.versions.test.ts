describe("Bulletin versions", () => {
  describe("version comparison logic", () => {
    it("should compute diff between two versions", () => {
      const vA: { moyennesMatiere: Record<string, number>; moyenneGenerale: number } = {
        moyennesMatiere: { Maths: 14, Francais: 12, Anglais: 10 },
        moyenneGenerale: 12,
      };
      const vB: { moyennesMatiere: Record<string, number>; moyenneGenerale: number } = {
        moyennesMatiere: { Maths: 15, Francais: 11, Anglais: 13 },
        moyenneGenerale: 13,
      };

      const allMatieres = new Set([
        ...Object.keys(vA.moyennesMatiere),
        ...Object.keys(vB.moyennesMatiere),
      ]);

      const diff = Array.from(allMatieres).map((matiere) => {
        const noteA = vA.moyennesMatiere[matiere] ?? null;
        const noteB = vB.moyennesMatiere[matiere] ?? null;
        return {
          matiere,
          noteA,
          noteB,
          change: noteA !== null && noteB !== null ? Math.round((noteB - noteA) * 100) / 100 : null,
        };
      });

      expect(diff).toHaveLength(3);
      const maths = diff.find((d) => d.matiere === "Maths");
      expect(maths?.change).toBe(1);
      const francais = diff.find((d) => d.matiere === "Francais");
      expect(francais?.change).toBe(-1);
      const anglais = diff.find((d) => d.matiere === "Anglais");
      expect(anglais?.change).toBe(3);
    });

    it("should handle matiere present in only one version", () => {
      const vA: { moyennesMatiere: Record<string, number>; moyenneGenerale: number } = { moyennesMatiere: { Maths: 14 }, moyenneGenerale: 14 };
      const vB: { moyennesMatiere: Record<string, number>; moyenneGenerale: number } = { moyennesMatiere: { Maths: 15, Physique: 12 }, moyenneGenerale: 13.5 };

      const allMatieres = new Set([
        ...Object.keys(vA.moyennesMatiere),
        ...Object.keys(vB.moyennesMatiere),
      ]);

      const diff = Array.from(allMatieres).map((matiere) => {
        const noteA = vA.moyennesMatiere[matiere] ?? null;
        const noteB = vB.moyennesMatiere[matiere] ?? null;
        return {
          matiere,
          noteA,
          noteB,
          change: noteA !== null && noteB !== null ? Math.round((noteB - noteA) * 100) / 100 : null,
        };
      });

      expect(diff).toHaveLength(2);
      const physique = diff.find((d) => d.matiere === "Physique");
      expect(physique?.noteA).toBeNull();
      expect(physique?.noteB).toBe(12);
      expect(physique?.change).toBeNull();
    });

    it("should handle empty moyennesMatiere", () => {
      const vA = { moyennesMatiere: {}, moyenneGenerale: null };
      const vB = { moyennesMatiere: {}, moyenneGenerale: null };

      const allMatieres = new Set([
        ...Object.keys(vA.moyennesMatiere),
        ...Object.keys(vB.moyennesMatiere),
      ]);

      const diff = Array.from(allMatieres);
      expect(diff).toHaveLength(0);
    });

    it("should round change to 2 decimal places", () => {
      const noteA = 12.333;
      const noteB = 14.667;
      const change = Math.round((noteB - noteA) * 100) / 100;
      expect(change).toBe(2.33);
    });
  });

  describe("version ordering", () => {
    it("should sort versions by versionNumber descending", () => {
      const versions = [
        { id: "v1", versionNumber: 1 },
        { id: "v3", versionNumber: 3 },
        { id: "v2", versionNumber: 2 },
      ];

      const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
      expect(sorted[0].versionNumber).toBe(3);
      expect(sorted[1].versionNumber).toBe(2);
      expect(sorted[2].versionNumber).toBe(1);
    });
  });
});
