describe("sendPushToUser", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return zeros when user does not exist", async () => {
    const mockGet = jest.fn().mockResolvedValue({ exists: false });
    const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
    const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

    jest.doMock("../../firebase", () => ({
      db: { collection: mockCollection },
      admin: { messaging: jest.fn() },
    }));

    const { sendPushToUser } = require("../../helpers/push");
    const result = await sendPushToUser("no-user", "Title", "Body");
    expect(result).toEqual({ sent: 0, failed: 0 });
  });

  it("should return zeros when user has no tokens", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ fcmTokens: [] }),
    });
    const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
    const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

    jest.doMock("../../firebase", () => ({
      db: { collection: mockCollection },
      admin: { messaging: jest.fn() },
    }));

    const { sendPushToUser } = require("../../helpers/push");
    const result = await sendPushToUser("user1", "Title", "Body");
    expect(result).toEqual({ sent: 0, failed: 0 });
  });

  it("should send push and return success count", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ fcmTokens: ["token1", "token2"] }),
    });
    const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
    const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

    const mockSendEach = jest.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [
        { success: true },
        { success: true },
      ],
    });

    jest.doMock("../../firebase", () => ({
      db: { collection: mockCollection },
      admin: {
        messaging: () => ({ sendEachForMulticast: mockSendEach }),
        firestore: { FieldValue: { arrayRemove: jest.fn() } },
      },
    }));

    const { sendPushToUser } = require("../../helpers/push");
    const result = await sendPushToUser("user1", "Test", "Hello");

    expect(result).toEqual({ sent: 2, failed: 0 });
    expect(mockSendEach).toHaveBeenCalledWith({
      notification: { title: "Test", body: "Hello" },
      tokens: ["token1", "token2"],
    });
  });

  it("should cleanup invalid tokens", async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    const mockGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ fcmTokens: ["valid", "invalid"] }),
    });
    const mockDoc = jest.fn().mockReturnValue({ get: mockGet, update: mockUpdate });
    const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

    const mockSendEach = jest.fn().mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      responses: [
        { success: true },
        { success: false, error: { code: "messaging/registration-token-not-registered" } },
      ],
    });

    const mockArrayRemove = jest.fn((...args: string[]) => ({ _op: "arrayRemove", values: args }));

    jest.doMock("../../firebase", () => ({
      db: { collection: mockCollection },
      admin: {
        messaging: () => ({ sendEachForMulticast: mockSendEach }),
        firestore: { FieldValue: { arrayRemove: mockArrayRemove } },
      },
    }));

    const { sendPushToUser } = require("../../helpers/push");
    const result = await sendPushToUser("user1", "Test", "Body");

    expect(result).toEqual({ sent: 1, failed: 1 });
    expect(mockArrayRemove).toHaveBeenCalledWith("invalid");
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("should handle messaging error gracefully", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ fcmTokens: ["token1"] }),
    });
    const mockDoc = jest.fn().mockReturnValue({ get: mockGet });
    const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc });

    const mockSendEach = jest.fn().mockRejectedValue(new Error("FCM down"));

    jest.doMock("../../firebase", () => ({
      db: { collection: mockCollection },
      admin: {
        messaging: () => ({ sendEachForMulticast: mockSendEach }),
        firestore: { FieldValue: { arrayRemove: jest.fn() } },
      },
    }));

    const { sendPushToUser } = require("../../helpers/push");
    const result = await sendPushToUser("user1", "Test", "Body");
    expect(result).toEqual({ sent: 0, failed: 1 });
  });
});
