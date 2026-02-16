import {
  isValidNote,
  isValidEmail,
  isValidDate,
  isValidMonth,
  isPositiveNumber,
  isNonNegativeNumber,
  getCurrentMonth,
  getLastDayOfMonth,
} from "../../helpers/validation";

describe("Validation helpers", () => {
  describe("isValidNote", () => {
    it("should accept valid notes", () => {
      expect(isValidNote(0, 20)).toBe(true);
      expect(isValidNote(10, 20)).toBe(true);
      expect(isValidNote(20, 20)).toBe(true);
      expect(isValidNote(5, 10)).toBe(true);
    });

    it("should reject invalid notes", () => {
      expect(isValidNote(-1, 20)).toBe(false);
      expect(isValidNote(21, 20)).toBe(false);
      expect(isValidNote(NaN, 20)).toBe(false);
    });
  });

  describe("isValidEmail", () => {
    it("should accept valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("no-at-sign")).toBe(false);
      expect(isValidEmail("@no-local.com")).toBe(false);
    });
  });

  describe("isValidDate", () => {
    it("should accept valid dates", () => {
      expect(isValidDate("2024-01-15")).toBe(true);
      expect(isValidDate("2024-12-31")).toBe(true);
    });

    it("should reject invalid dates", () => {
      expect(isValidDate("2024-13-01")).toBe(false);
      expect(isValidDate("not-a-date")).toBe(false);
      expect(isValidDate("")).toBe(false);
    });
  });

  describe("isValidMonth", () => {
    it("should accept valid months", () => {
      expect(isValidMonth("2024-01")).toBe(true);
      expect(isValidMonth("2024-12")).toBe(true);
    });

    it("should reject invalid months", () => {
      expect(isValidMonth("2024-1")).toBe(false);
      expect(isValidMonth("2024")).toBe(false);
    });
  });

  describe("isPositiveNumber", () => {
    it("should accept positive numbers", () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(100)).toBe(true);
    });

    it("should reject non-positive values", () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber("5")).toBe(false);
    });
  });

  describe("isNonNegativeNumber", () => {
    it("should accept zero and positive numbers", () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(1)).toBe(true);
    });

    it("should reject negative values", () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
    });
  });

  describe("getCurrentMonth", () => {
    it("should return current month in YYYY-MM format", () => {
      const result = getCurrentMonth();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe("getLastDayOfMonth", () => {
    it("should return correct last day", () => {
      expect(getLastDayOfMonth("2024-01")).toBe("2024-01-31");
      expect(getLastDayOfMonth("2024-02")).toBe("2024-02-29"); // leap year
      expect(getLastDayOfMonth("2023-02")).toBe("2023-02-28");
      expect(getLastDayOfMonth("2024-04")).toBe("2024-04-30");
    });
  });
});
