import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { Bulletin } from "./notes.types";

export async function getBulletinsByEleve(eleveId: string): Promise<Bulletin[]> {
  const q = query(
    collection(db, "bulletins"),
    where("eleveId", "==", eleveId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Bulletin[];
}

export async function getBulletinsByClasse(classe: string, trimestre?: number, anneeScolaire?: string): Promise<Bulletin[]> {
  let q = query(
    collection(db, "bulletins"),
    where("classe", "==", classe)
  );
  if (trimestre) {
    q = query(q, where("trimestre", "==", trimestre));
  }
  if (anneeScolaire) {
    q = query(q, where("anneeScolaire", "==", anneeScolaire));
  }
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Bulletin[];
}
