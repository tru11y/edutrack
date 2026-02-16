import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  enabled?: boolean;
}

export function useKeyboardShortcuts(config: ShortcutConfig = {}) {
  const { enabled = true } = config;
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "k") {
        e.preventDefault();
        // Focus global search if it exists
        const searchInput = document.querySelector<HTMLInputElement>('[data-global-search]');
        if (searchInput) searchInput.focus();
      }

      if (ctrl && e.key === "d") {
        e.preventDefault();
        navigate("/");
      }

      if (ctrl && e.key === "e") {
        e.preventDefault();
        navigate("/eleves");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, navigate]);
}
