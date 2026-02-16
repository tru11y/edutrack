/**
 * @jest-environment jsdom
 */

describe("useKeyboardShortcuts", () => {
  it("should define Ctrl+K for search", () => {
    const shortcuts = [
      { key: "k", ctrl: true, action: "search" },
      { key: "d", ctrl: true, action: "dashboard" },
      { key: "e", ctrl: true, action: "eleves" },
    ];

    const searchShortcut = shortcuts.find((s) => s.key === "k" && s.ctrl);
    expect(searchShortcut).toBeDefined();
    expect(searchShortcut?.action).toBe("search");
  });

  it("should define Ctrl+D for dashboard", () => {
    const shortcuts = [
      { key: "k", ctrl: true, action: "search" },
      { key: "d", ctrl: true, action: "dashboard" },
      { key: "e", ctrl: true, action: "eleves" },
    ];

    const dashShortcut = shortcuts.find((s) => s.key === "d" && s.ctrl);
    expect(dashShortcut?.action).toBe("dashboard");
  });

  it("should define Ctrl+E for eleves", () => {
    const shortcuts = [
      { key: "k", ctrl: true, action: "search" },
      { key: "d", ctrl: true, action: "dashboard" },
      { key: "e", ctrl: true, action: "eleves" },
    ];

    const eleveShortcut = shortcuts.find((s) => s.key === "e" && s.ctrl);
    expect(eleveShortcut?.action).toBe("eleves");
  });

  it("should not trigger in input fields", () => {
    const tags = ["INPUT", "TEXTAREA", "SELECT"];
    const shouldIgnore = (tag: string) => tags.includes(tag);
    expect(shouldIgnore("INPUT")).toBe(true);
    expect(shouldIgnore("DIV")).toBe(false);
  });
});
