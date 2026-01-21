import { unbanEleve } from "./paiement.service";
import { updateEleveSystem } from "../eleves/eleve.service";

jest.mock("../eleves/eleve.service", () => ({
  updateEleveSystem: jest.fn(),
}));

describe("unbanEleve", () => {
  it("débanne un élève", async () => {
    await unbanEleve("eleve123");

    expect(updateEleveSystem).toHaveBeenCalledWith("eleve123", {
      isBanned: false,
      banReason: null,
      banDate: null,
    });
  });
});
