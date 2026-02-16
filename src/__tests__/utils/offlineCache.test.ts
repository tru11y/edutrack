import { cacheData, getCachedData, clearCache } from "../../utils/offlineCache";

// Mock localStorage
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: jest.fn((key: string) => store[key] || null),
  setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: jest.fn((key: string) => { delete store[key]; }),
};
Object.defineProperty(global, "localStorage", { value: mockLocalStorage });

describe("offlineCache", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    jest.clearAllMocks();
  });

  describe("cacheData", () => {
    it("should store data in localStorage", () => {
      cacheData("test", { foo: "bar" });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "edutrack_cache_test",
        expect.any(String)
      );
    });

    it("should store data with timestamp", () => {
      cacheData("test", [1, 2, 3]);
      const stored = JSON.parse(store["edutrack_cache_test"]);
      expect(stored.data).toEqual([1, 2, 3]);
      expect(stored.timestamp).toBeDefined();
      expect(typeof stored.timestamp).toBe("number");
    });
  });

  describe("getCachedData", () => {
    it("should retrieve cached data", () => {
      cacheData("test", { value: 42 });
      const result = getCachedData<{ value: number }>("test");
      expect(result).toEqual({ value: 42 });
    });

    it("should return null for expired data", () => {
      store["edutrack_cache_expired"] = JSON.stringify({
        data: "old",
        timestamp: Date.now() - 10 * 60 * 1000, // 10 min ago
      });
      const result = getCachedData("expired", 5 * 60 * 1000); // 5 min TTL
      expect(result).toBeNull();
    });

    it("should return null for missing key", () => {
      const result = getCachedData("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("clearCache", () => {
    it("should clear specific key", () => {
      cacheData("test1", "a");
      clearCache("test1");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("edutrack_cache_test1");
    });
  });
});
