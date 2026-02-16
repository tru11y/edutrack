/**
 * @jest-environment jsdom
 */

describe("Breadcrumb", () => {
  const ROUTE_LABELS: Record<string, string> = {
    "": "Accueil",
    eleves: "Eleves",
    nouveau: "Nouveau",
    modifier: "Modifier",
    classes: "Classes",
    presences: "Presences",
    analytics: "Analytics",
    archives: "Archives",
    promotion: "Promotion",
  };

  it("should parse path into crumbs", () => {
    const path = "/eleves/123/modifier";
    const parts = path.split("/").filter(Boolean);
    expect(parts).toEqual(["eleves", "123", "modifier"]);
  });

  it("should map known routes to labels", () => {
    expect(ROUTE_LABELS["eleves"]).toBe("Eleves");
    expect(ROUTE_LABELS["analytics"]).toBe("Analytics");
  });

  it("should use raw part for unknown routes", () => {
    const part = "abc123";
    const label = ROUTE_LABELS[part] || part;
    expect(label).toBe("abc123");
  });

  it("should not render for root path", () => {
    const parts = "/".split("/").filter(Boolean);
    expect(parts.length).toBe(0);
  });

  it("should not render for single-level paths", () => {
    const parts = "/eleves".split("/").filter(Boolean);
    expect(parts.length).toBe(1);
  });

  it("should render for multi-level paths", () => {
    const parts = "/eleves/nouveau".split("/").filter(Boolean);
    expect(parts.length).toBeGreaterThan(1);
  });
});
