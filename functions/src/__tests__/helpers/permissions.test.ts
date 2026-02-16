describe("Permissions helpers", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("getUserPermissions", () => {
    it("should return empty array for non-existent user", async () => {
      const mockGet = jest.fn().mockResolvedValue({ exists: false });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { getUserPermissions } = require("../../helpers/permissions");
      const result = await getUserPermissions("unknown");
      expect(result).toEqual([]);
    });

    it("should return explicit permissions when set", async () => {
      const perms = ["MANAGE_NOTES", "MANAGE_PRESENCES"];
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: "prof", permissions: perms }),
      });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { getUserPermissions } = require("../../helpers/permissions");
      const result = await getUserPermissions("prof-uid");
      expect(result).toEqual(perms);
    });

    it("should fall back to role defaults when no explicit permissions", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: "prof" }),
      });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { getUserPermissions } = require("../../helpers/permissions");
      const result = await getUserPermissions("prof-uid");
      expect(result).toEqual(["MANAGE_NOTES", "MANAGE_PRESENCES", "MANAGE_CAHIER"]);
    });

    it("should return all permissions for admin role default", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: "admin" }),
      });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { getUserPermissions } = require("../../helpers/permissions");
      const result = await getUserPermissions("admin-uid");
      expect(result).toHaveLength(13);
      expect(result).toContain("MANAGE_USERS");
    });
  });

  describe("verifyPermission", () => {
    it("should return false for non-existent user", async () => {
      const mockGet = jest.fn().mockResolvedValue({ exists: false });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { verifyPermission } = require("../../helpers/permissions");
      const result = await verifyPermission("unknown", "MANAGE_USERS");
      expect(result).toBe(false);
    });

    it("should always return true for admin regardless of permission", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: "admin" }),
      });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { verifyPermission } = require("../../helpers/permissions");
      expect(await verifyPermission("admin-uid", "MANAGE_USERS")).toBe(true);
      expect(await verifyPermission("admin-uid", "ANYTHING")).toBe(true);
    });

    it("should check explicit permissions for non-admin", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: "gestionnaire", permissions: ["MANAGE_PAYMENTS", "VIEW_ANALYTICS"] }),
      });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { verifyPermission } = require("../../helpers/permissions");
      expect(await verifyPermission("gest-uid", "MANAGE_PAYMENTS")).toBe(true);
      expect(await verifyPermission("gest-uid", "MANAGE_USERS")).toBe(false);
    });

    it("should use role defaults when no explicit permissions", async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: "prof" }),
      });
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

      jest.doMock("../../firebase", () => ({
        db: { collection: mockCollection },
      }));

      const { verifyPermission } = require("../../helpers/permissions");
      expect(await verifyPermission("prof-uid", "MANAGE_NOTES")).toBe(true);
      expect(await verifyPermission("prof-uid", "MANAGE_USERS")).toBe(false);
    });
  });
});
