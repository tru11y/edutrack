import { estFacturable } from "./facturation.logic";

describe("estFacturable", () => {
  test("présent → facturable", () => {
    expect(estFacturable("present", 0)).toBe(true);
  });

  test("absent → non facturable", () => {
    expect(estFacturable("absent", 0)).toBe(false);
  });

  test("retard 10 min → facturable", () => {
    expect(estFacturable("retard", 10)).toBe(true);
  });

  test("retard 20 min → non facturable", () => {
    expect(estFacturable("retard", 20)).toBe(false);
  });
});
