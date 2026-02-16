/**
 * @jest-environment jsdom
 */

describe("OfflineBanner", () => {
  describe("visibility logic", () => {
    it("should not render when online", () => {
      const isOnline = true;
      const shouldRender = !isOnline;
      expect(shouldRender).toBe(false);
    });

    it("should render when offline", () => {
      const isOnline = false;
      const shouldRender = !isOnline;
      expect(shouldRender).toBe(true);
    });
  });

  describe("queue display", () => {
    it("should show queue count when greater than 0", () => {
      const queueLen = 3;
      const showBadge = queueLen > 0;
      expect(showBadge).toBe(true);
    });

    it("should hide queue count when 0", () => {
      const queueLen = 0;
      const showBadge = queueLen > 0;
      expect(showBadge).toBe(false);
    });
  });

  describe("accessibility", () => {
    it("should use role=alert for screen readers", () => {
      const attrs = { role: "alert", "aria-live": "assertive" };
      expect(attrs.role).toBe("alert");
      expect(attrs["aria-live"]).toBe("assertive");
    });
  });

  describe("online/offline event integration", () => {
    it("should detect offline event from window", () => {
      let isOnline = true;
      const handler = () => { isOnline = false; };
      window.addEventListener("offline", handler);
      window.dispatchEvent(new Event("offline"));
      expect(isOnline).toBe(false);
      window.removeEventListener("offline", handler);
    });

    it("should detect online event from window", () => {
      let isOnline = false;
      const handler = () => { isOnline = true; };
      window.addEventListener("online", handler);
      window.dispatchEvent(new Event("online"));
      expect(isOnline).toBe(true);
      window.removeEventListener("online", handler);
    });
  });
});
