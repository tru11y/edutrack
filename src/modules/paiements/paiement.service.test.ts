import { unbanEleve, unbanEleveIfFullyPaid } from "./paiement.service";
import { updateEleveSystem } from "../eleves/eleve.service";

jest.mock("../eleves/eleve.service", () => ({
  updateEleveSystem: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock("../../services/firebase", () => ({
  db: {},
}));

describe("paiement.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("unbanEleve", () => {
    it("should call updateEleveSystem to remove ban", async () => {
      await unbanEleve("e1");
      expect(updateEleveSystem).toHaveBeenCalledWith("e1", {
        isBanned: false,
        banReason: null,
        banDate: null,
      });
    });
  });

  describe("unbanEleveIfFullyPaid", () => {
    it("should unban if montantRestant is 0", async () => {
      await unbanEleveIfFullyPaid("e1", 0);
      expect(updateEleveSystem).toHaveBeenCalledWith("e1", {
        isBanned: false,
        banReason: null,
        banDate: null,
      });
    });

    it("should unban if montantRestant is negative", async () => {
      await unbanEleveIfFullyPaid("e1", -100);
      expect(updateEleveSystem).toHaveBeenCalled();
    });

    it("should not unban if montantRestant is positive", async () => {
      await unbanEleveIfFullyPaid("e1", 5000);
      expect(updateEleveSystem).not.toHaveBeenCalled();
    });
  });
});
