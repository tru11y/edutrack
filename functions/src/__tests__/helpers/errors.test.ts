import { requireAuth, requirePermission, requireArgument, notFound, handleError } from "../../helpers/errors";

describe("Error helpers", () => {
  describe("requireAuth", () => {
    it("should not throw when uid is provided", () => {
      expect(() => requireAuth("valid-uid")).not.toThrow();
    });

    it("should throw unauthenticated when uid is undefined", () => {
      expect(() => requireAuth(undefined)).toThrow();
      try {
        requireAuth(undefined);
      } catch (e: unknown) {
        const err = e as { code: string };
        expect(err.code).toBe("unauthenticated");
      }
    });
  });

  describe("requirePermission", () => {
    it("should not throw when allowed is true", () => {
      expect(() => requirePermission(true)).not.toThrow();
    });

    it("should throw permission-denied when allowed is false", () => {
      expect(() => requirePermission(false)).toThrow();
      try {
        requirePermission(false);
      } catch (e: unknown) {
        const err = e as { code: string };
        expect(err.code).toBe("permission-denied");
      }
    });

    it("should include custom message", () => {
      try {
        requirePermission(false, "Custom error");
      } catch (e: unknown) {
        const err = e as { message: string };
        expect(err.message).toBe("Custom error");
      }
    });
  });

  describe("requireArgument", () => {
    it("should not throw when condition is true", () => {
      expect(() => requireArgument(true, "Error")).not.toThrow();
    });

    it("should throw invalid-argument when condition is false", () => {
      expect(() => requireArgument(false, "Field required")).toThrow();
      try {
        requireArgument(false, "Field required");
      } catch (e: unknown) {
        const err = e as { code: string; message: string };
        expect(err.code).toBe("invalid-argument");
        expect(err.message).toBe("Field required");
      }
    });
  });

  describe("notFound", () => {
    it("should throw not-found error", () => {
      expect(() => notFound("Item not found")).toThrow();
      try {
        notFound("Item not found");
      } catch (e: unknown) {
        const err = e as { code: string };
        expect(err.code).toBe("not-found");
      }
    });
  });

  describe("handleError", () => {
    it("should rethrow HttpsError as-is", () => {
      const { HttpsError } = require("firebase-functions").https;
      const original = new HttpsError("already-exists", "Already exists");
      try {
        handleError(original, "Fallback message");
      } catch (e: unknown) {
        const err = e as { code: string; message: string };
        expect(err.code).toBe("already-exists");
        expect(err.message).toBe("Already exists");
      }
    });

    it("should wrap generic errors as internal", () => {
      try {
        handleError(new Error("DB error"), "Operation failed");
      } catch (e: unknown) {
        const err = e as { code: string; message: string };
        expect(err.code).toBe("internal");
        expect(err.message).toBe("Operation failed");
      }
    });
  });
});
