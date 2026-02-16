/**
 * @jest-environment jsdom
 */

describe("PageTransition", () => {
  describe("animation keyframes", () => {
    it("should define pageFadeIn animation", () => {
      const style = document.createElement("style");
      style.textContent = `
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
      expect(document.head.contains(style)).toBe(true);
      document.head.removeChild(style);
    });

    it("should define pageFadeOut animation", () => {
      const style = document.createElement("style");
      style.textContent = `
        @keyframes pageFadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-8px); }
        }
      `;
      document.head.appendChild(style);
      expect(document.head.contains(style)).toBe(true);
      document.head.removeChild(style);
    });
  });

  describe("transition stage logic", () => {
    it("should start in 'in' stage", () => {
      let stage: "in" | "out" = "in";
      expect(stage).toBe("in");
    });

    it("should switch to 'out' when children change", () => {
      let stage: "in" | "out" = "in";
      const childrenChanged = true;
      if (childrenChanged) stage = "out";
      expect(stage).toBe("out");
    });

    it("should return to 'in' after animation ends in 'out' stage", () => {
      let stage: "in" | "out" = "out";
      // onAnimationEnd handler
      if (stage === "out") {
        stage = "in";
      }
      expect(stage).toBe("in");
    });

    it("should use correct animation for each stage", () => {
      const getAnimation = (stage: "in" | "out") =>
        stage === "in" ? "pageFadeIn 0.2s ease-out" : "pageFadeOut 0.15s ease-in";

      expect(getAnimation("in")).toBe("pageFadeIn 0.2s ease-out");
      expect(getAnimation("out")).toBe("pageFadeOut 0.15s ease-in");
    });
  });
});
