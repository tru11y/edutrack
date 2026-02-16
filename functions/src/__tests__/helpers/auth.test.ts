// Unit tests for auth helper functions
// These test the pure logic parts of auth helpers

describe("Auth helpers", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("verifyAdmin", () => {
    it("should return false for non-existent user", async () => {
      const mockGet = jest.fn().mockResolvedValue({ exists: false });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { verifyAdmin } = require("../../helpers/auth");
      const result = await verifyAdmin("non-existent-uid");
      expect(result).toBe(false);
    });

    it("should return true for admin user", async () => {
      const mockGet = jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: "admin" }) });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { verifyAdmin } = require("../../helpers/auth");
      const result = await verifyAdmin("admin-uid");
      expect(result).toBe(true);
    });

    it("should return false for non-admin user", async () => {
      const mockGet = jest.fn().mockResolvedValue({ exists: true, data: () => ({ role: "prof" }) });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { verifyAdmin } = require("../../helpers/auth");
      const result = await verifyAdmin("prof-uid");
      expect(result).toBe(false);
    });
  });

  describe("verifyStaff", () => {
    it("should return true for admin, gestionnaire, and prof", async () => {
      for (const role of ["admin", "gestionnaire", "prof"]) {
        jest.resetModules();
        const mockGet = jest.fn().mockResolvedValue({ exists: true, data: () => ({ role }) });
        const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
        const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

        jest.doMock("../../firebase", () => ({
          db: { collection: mockCollection },
        }));

        const { verifyStaff } = require("../../helpers/auth");
        const result = await verifyStaff(`${role}-uid`);
        expect(result).toBe(true);
      }
    });

    it("should return false for eleve and parent", async () => {
      for (const role of ["eleve", "parent"]) {
        jest.resetModules();
        const mockGet = jest.fn().mockResolvedValue({ exists: true, data: () => ({ role }) });
        const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
        const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

        jest.doMock("../../firebase", () => ({
          db: { collection: mockCollection },
        }));

        const { verifyStaff } = require("../../helpers/auth");
        const result = await verifyStaff(`${role}-uid`);
        expect(result).toBe(false);
      }
    });
  });
});
