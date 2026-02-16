import { enqueueOperation, getQueueLength, processQueue, clearQueue } from "../../utils/offlineQueue";

// Mock localStorage
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: jest.fn((key: string) => store[key] || null),
  setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: jest.fn((key: string) => { delete store[key]; }),
};
Object.defineProperty(global, "localStorage", { value: mockLocalStorage });

describe("offlineQueue", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    jest.clearAllMocks();
  });

  describe("enqueueOperation", () => {
    it("should add operation to queue", () => {
      enqueueOperation("createUser", { name: "Alice" });
      expect(getQueueLength()).toBe(1);
    });

    it("should accumulate multiple operations", () => {
      enqueueOperation("fn1", { a: 1 });
      enqueueOperation("fn2", { b: 2 });
      enqueueOperation("fn3", { c: 3 });
      expect(getQueueLength()).toBe(3);
    });

    it("should store function name and data", () => {
      enqueueOperation("myFunc", { key: "val" });
      const raw = JSON.parse(store["edutrack_offline_queue"]);
      expect(raw[0].functionName).toBe("myFunc");
      expect(raw[0].data).toEqual({ key: "val" });
      expect(raw[0].id).toBeDefined();
      expect(raw[0].timestamp).toBeDefined();
    });
  });

  describe("getQueueLength", () => {
    it("should return 0 for empty queue", () => {
      expect(getQueueLength()).toBe(0);
    });

    it("should return correct count", () => {
      enqueueOperation("a", null);
      enqueueOperation("b", null);
      expect(getQueueLength()).toBe(2);
    });

    it("should return 0 for invalid JSON", () => {
      store["edutrack_offline_queue"] = "not-json";
      expect(getQueueLength()).toBe(0);
    });
  });

  describe("processQueue", () => {
    it("should process all operations successfully", async () => {
      enqueueOperation("fn1", { x: 1 });
      enqueueOperation("fn2", { x: 2 });

      const executor = jest.fn().mockResolvedValue(undefined);
      const result = await processQueue(executor);

      expect(result).toEqual({ processed: 2, failed: 0 });
      expect(executor).toHaveBeenCalledTimes(2);
      expect(getQueueLength()).toBe(0);
    });

    it("should keep failed operations in queue", async () => {
      enqueueOperation("fn1", { x: 1 });
      enqueueOperation("fn2", { x: 2 });

      const executor = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("fail"));

      const result = await processQueue(executor);

      expect(result).toEqual({ processed: 1, failed: 1 });
      expect(getQueueLength()).toBe(1);
    });

    it("should return zeros for empty queue", async () => {
      const executor = jest.fn();
      const result = await processQueue(executor);

      expect(result).toEqual({ processed: 0, failed: 0 });
      expect(executor).not.toHaveBeenCalled();
    });
  });

  describe("clearQueue", () => {
    it("should remove all queued operations", () => {
      enqueueOperation("fn1", {});
      enqueueOperation("fn2", {});
      clearQueue();
      expect(getQueueLength()).toBe(0);
    });
  });
});
