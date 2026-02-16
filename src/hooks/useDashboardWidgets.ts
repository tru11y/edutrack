import { useState, useCallback } from "react";

export interface DashboardWidget {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: "stats", label: "Statistiques", visible: true, order: 0 },
  { id: "atRisk", label: "Eleves a risque", visible: true, order: 1 },
  { id: "finances", label: "Finances", visible: true, order: 2 },
  { id: "quickActions", label: "Actions rapides", visible: true, order: 3 },
  { id: "trends", label: "Tendances", visible: true, order: 4 },
  { id: "classeComparison", label: "Comparaison classes", visible: true, order: 5 },
];

const STORAGE_KEY = "edutrack_dashboard_widgets";

function loadWidgets(): DashboardWidget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const saved: DashboardWidget[] = JSON.parse(raw);
    // Merge with defaults to pick up any new widgets
    const savedIds = new Set(saved.map((w) => w.id));
    const merged = [
      ...saved,
      ...DEFAULT_WIDGETS.filter((d) => !savedIds.has(d.id)),
    ];
    return merged.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_WIDGETS;
  }
}

function saveWidgets(widgets: DashboardWidget[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch {
    // localStorage unavailable
  }
}

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(loadWidgets);

  const toggleWidget = useCallback((id: string) => {
    setWidgets((prev) => {
      const updated = prev.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w
      );
      saveWidgets(updated);
      return updated;
    });
  }, []);

  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setWidgets((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      const reordered = updated.map((w, i) => ({ ...w, order: i }));
      saveWidgets(reordered);
      return reordered;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    saveWidgets(DEFAULT_WIDGETS);
    setWidgets(DEFAULT_WIDGETS);
  }, []);

  const isVisible = useCallback(
    (id: string) => widgets.find((w) => w.id === id)?.visible ?? true,
    [widgets]
  );

  return { widgets, toggleWidget, reorderWidgets, resetToDefault, isVisible };
}
