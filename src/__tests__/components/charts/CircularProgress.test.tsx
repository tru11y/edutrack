/**
 * @jest-environment jsdom
 */

describe("CircularProgress", () => {
  it("should clamp percentage between 0 and 100", () => {
    const clamp = (val: number) => Math.max(0, Math.min(100, val));
    expect(clamp(-10)).toBe(0);
    expect(clamp(50)).toBe(50);
    expect(clamp(150)).toBe(100);
  });

  it("should calculate correct SVG dashoffset", () => {
    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2; // 55
    const circumference = 2 * Math.PI * radius; // ~345.58
    const percentage = 75;
    const offset = circumference - (percentage / 100) * circumference;

    expect(radius).toBe(55);
    expect(offset).toBeCloseTo(circumference * 0.25, 1);
  });

  it("should use full circumference for 0%", () => {
    const circumference = 2 * Math.PI * 55;
    const offset = circumference - (0 / 100) * circumference;
    expect(offset).toBe(circumference);
  });

  it("should use zero offset for 100%", () => {
    const circumference = 2 * Math.PI * 55;
    const offset = circumference - (100 / 100) * circumference;
    expect(offset).toBe(0);
  });
});
