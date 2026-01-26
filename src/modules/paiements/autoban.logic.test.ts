import { doitEtreBanni } from "./autoban.service";

describe("Auto-ban logic", () => {
  describe("doitEtreBanni", () => {
    it("should not ban with 0 months unpaid", () => {
      expect(doitEtreBanni(0)).toBe(false);
    });

    it("should not ban with 1 month unpaid", () => {
      expect(doitEtreBanni(1)).toBe(false);
    });

    it("should ban with 2 months unpaid", () => {
      expect(doitEtreBanni(2)).toBe(true);
    });

    it("should ban with 3+ months unpaid", () => {
      expect(doitEtreBanni(3)).toBe(true);
      expect(doitEtreBanni(5)).toBe(true);
      expect(doitEtreBanni(12)).toBe(true);
    });
  });
});
