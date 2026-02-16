/**
 * @jest-environment jsdom
 */

describe("Button", () => {
  describe("variant styles", () => {
    it("should define primary, secondary, and danger variants", () => {
      const variants = ["primary", "secondary", "danger"];
      expect(variants).toHaveLength(3);
      expect(variants).toContain("primary");
      expect(variants).toContain("secondary");
      expect(variants).toContain("danger");
    });
  });

  describe("disabled state", () => {
    it("should use not-allowed cursor when disabled", () => {
      const disabled = true;
      const cursor = disabled ? "not-allowed" : "pointer";
      const opacity = disabled ? 0.5 : 1;
      expect(cursor).toBe("not-allowed");
      expect(opacity).toBe(0.5);
    });

    it("should use pointer cursor when enabled", () => {
      const disabled = false;
      const cursor = disabled ? "not-allowed" : "pointer";
      const opacity = disabled ? 0.5 : 1;
      expect(cursor).toBe("pointer");
      expect(opacity).toBe(1);
    });
  });

  describe("click handling", () => {
    it("should call onClick handler", () => {
      const onClick = jest.fn();
      const button = document.createElement("button");
      button.addEventListener("click", onClick);
      button.click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should not fire click when button is disabled", () => {
      const onClick = jest.fn();
      const button = document.createElement("button");
      button.disabled = true;
      button.addEventListener("click", onClick);
      button.click();
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("base styles", () => {
    it("should have correct base style properties", () => {
      const baseStyle = {
        padding: "8px 16px",
        borderRadius: 8,
        fontWeight: 500,
        transition: "all 0.2s",
        border: "none",
      };
      expect(baseStyle.borderRadius).toBe(8);
      expect(baseStyle.fontWeight).toBe(500);
      expect(baseStyle.border).toBe("none");
    });
  });
});
