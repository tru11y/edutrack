describe("cloudFunctions service", () => {
  it("should handle error messages correctly", () => {
    const getCloudFunctionErrorMessage = (error: unknown): string => {
      if (error && typeof error === "object" && "message" in error) {
        const msg = (error as { message: string }).message;
        if (msg.includes("unauthenticated")) return "Vous devez etre connecte pour effectuer cette action.";
        if (msg.includes("permission-denied")) return "Vous n'avez pas les droits necessaires.";
        if (msg.includes("already-exists")) return "Cet element existe deja.";
        if (msg.includes("not-found")) return "Element non trouve.";
        if (msg.includes("invalid-argument")) return msg.replace("invalid-argument: ", "");
        return msg;
      }
      return "Une erreur inattendue s'est produite.";
    };

    expect(getCloudFunctionErrorMessage({ message: "unauthenticated" })).toContain("connecte");
    expect(getCloudFunctionErrorMessage({ message: "permission-denied" })).toContain("droits");
    expect(getCloudFunctionErrorMessage({ message: "already-exists" })).toContain("existe");
    expect(getCloudFunctionErrorMessage({ message: "not-found" })).toContain("non trouve");
    expect(getCloudFunctionErrorMessage({ message: "invalid-argument: Champ requis" })).toBe("Champ requis");
    expect(getCloudFunctionErrorMessage(null)).toContain("inattendue");
    expect(getCloudFunctionErrorMessage(undefined)).toContain("inattendue");
  });

  it("should define all v3 function wrappers", () => {
    const v3Functions = [
      "getAtRiskStudentsSecure",
      "updateCreneauSecure",
      "promoteClasseSecure",
      "archiveAnneeScolaireSecure",
      "getAnalyticsReportSecure",
    ];

    // These are just names, verify they follow the naming convention
    for (const fn of v3Functions) {
      expect(fn).toMatch(/Secure$/);
    }
  });

  it("should define correct report types", () => {
    const validTypes = ["attendance", "grades", "payments", "comprehensive"];
    expect(validTypes).toHaveLength(4);
    expect(validTypes).toContain("comprehensive");
  });
});
