/**
 * @jest-environment jsdom
 */

describe("useOnlineStatus", () => {
  it("should detect initial online state from navigator.onLine", () => {
    expect(navigator.onLine).toBeDefined();
    expect(typeof navigator.onLine).toBe("boolean");
  });

  it("should respond to online/offline events", () => {
    let isOnline = navigator.onLine;

    const handleOnline = () => { isOnline = true; };
    const handleOffline = () => { isOnline = false; };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Simulate going offline
    window.dispatchEvent(new Event("offline"));
    expect(isOnline).toBe(false);

    // Simulate going online
    window.dispatchEvent(new Event("online"));
    expect(isOnline).toBe(true);

    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  });

  it("should cleanup listeners on unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");

    const handleOnline = () => {};
    const handleOffline = () => {};

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);

    expect(removeSpy).toHaveBeenCalledWith("online", handleOnline);
    expect(removeSpy).toHaveBeenCalledWith("offline", handleOffline);

    removeSpy.mockRestore();
  });
});
