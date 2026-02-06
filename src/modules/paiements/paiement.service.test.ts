import { enregistrerVersement } from "./paiement.service";
import { calculerPaiement } from "./paiement.logic";
import { updateEleveSystem } from "../eleves/eleve.service";
import { updateDoc } from "firebase/firestore";
import type { Paiement } from "./paiement.types";

jest.mock("./paiement.logic", () => ({
  calculerPaiement: jest.fn(),
}));

jest.mock("../eleves/eleve.service", () => ({
  updateEleveSystem: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
}));

describe("enregistrerVersement", () => {
  it("ajoute un versement et met à jour le statut", async () => {
    (calculerPaiement as jest.Mock).mockReturnValue({
      statut: "paye",
      montantRestant: 0,
    });

    const fakePaiement: Partial<Paiement> = {
      id: "p1",
      eleveId: "e1",
      mois: "2026-01",
      montantTotal: 10000,
      montantPaye: 4000,
      montantRestant: 6000,
      statut: "partiel",
      versements: [],
    };

    await enregistrerVersement(fakePaiement, 6000, "especes");

    expect(updateDoc).toHaveBeenCalled();
    expect(updateEleveSystem).toHaveBeenCalledWith("e1", {
      isBanned: false,
      banReason: null,
      banDate: null,
    });
  });
});
