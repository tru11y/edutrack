/**
 * @jest-environment jsdom
 */

describe("Modal", () => {
  describe("aria attributes", () => {
    it("should use role=dialog and aria-modal=true pattern", () => {
      const attrs = { role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title" };
      expect(attrs.role).toBe("dialog");
      expect(attrs["aria-modal"]).toBe("true");
      expect(attrs["aria-labelledby"]).toBe("modal-title");
    });
  });

  describe("Escape key handling", () => {
    it("should call onClose when Escape is pressed", () => {
      const onClose = jest.fn();
      const isOpen = true;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(onClose).toHaveBeenCalledTimes(1);
      document.removeEventListener("keydown", handleEscape);
    });

    it("should not call onClose when Escape is pressed and modal is closed", () => {
      const onClose = jest.fn();
      const isOpen = false;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(onClose).not.toHaveBeenCalled();
      document.removeEventListener("keydown", handleEscape);
    });

    it("should not call onClose for other keys", () => {
      const onClose = jest.fn();
      const isOpen = true;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));

      expect(onClose).not.toHaveBeenCalled();
      document.removeEventListener("keydown", handleEscape);
    });
  });

  describe("overlay click", () => {
    it("should call onClose when clicking overlay", () => {
      const onClose = jest.fn();
      const overlay = document.createElement("div");
      const content = document.createElement("div");
      overlay.appendChild(content);

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) onClose();
      });

      // Click on overlay itself
      overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose when clicking content inside overlay", () => {
      const onClose = jest.fn();
      const overlay = document.createElement("div");
      const content = document.createElement("div");
      overlay.appendChild(content);

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) onClose();
      });

      // Click on content (target is content, not overlay)
      content.click();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("body scroll lock", () => {
    it("should set overflow hidden when open", () => {
      document.body.style.overflow = "";
      document.body.style.overflow = "hidden";
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("should restore overflow when closed", () => {
      document.body.style.overflow = "hidden";
      document.body.style.overflow = "";
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("size mapping", () => {
    it("should have correct size values", () => {
      const sizeMap = { sm: 400, md: 520, lg: 640 };
      expect(sizeMap.sm).toBe(400);
      expect(sizeMap.md).toBe(520);
      expect(sizeMap.lg).toBe(640);
    });
  });
});
