import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import type { Professeur } from "./professeur.types";

const profsRef = collection(db, "professeurs");
const usersRef = collection(db, "users");

/* ======================
   CREATE PROF + ACCOUNT
====================== */

export async function createProfesseurWithAccount(
  profData: Omit<Professeur, "id" | "createdAt" | "updatedAt">,
  email: string,
  password: string,
  schoolId?: string
) {
  // 1. Auth account
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // 2. Prof Firestore
  const profRef = await addDoc(profsRef, {
    ...profData,
    statut: "actif",
    schoolId: schoolId || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const professeurId = profRef.id;

  // 3. User Firestore
  await setDoc(doc(usersRef, uid), {
    uid,
    email,
    role: "prof",
    isActive: true,
    professeurId,
    schoolId: schoolId || "",
    createdAt: serverTimestamp(),
  });

  return professeurId;
}

/* ======================
   READ
====================== */

export async function getAllProfesseurs(schoolId?: string | null): Promise<Professeur[]> {
  // Fetch from both sources in parallel:
  // 1. professeurs collection (created via createProfesseurWithAccount)
  // 2. users with role=prof (created via Users page — no professeurs doc)
  // Include profs with correct schoolId, empty schoolId, or missing schoolId (legacy data)
  const [profsSnap, profsNoSchoolSnap, usersProfsSnap, usersProfsNoSchoolSnap] = schoolId
    ? await Promise.all([
        getDocs(query(profsRef, where("schoolId", "==", schoolId))),
        getDocs(query(profsRef, where("schoolId", "==", ""))),
        getDocs(query(usersRef, where("role", "==", "prof"), where("schoolId", "==", schoolId))),
        getDocs(query(usersRef, where("role", "==", "prof"), where("schoolId", "==", ""))),
      ])
    : await Promise.all([
        getDocs(profsRef),
        Promise.resolve({ docs: [] } as { docs: never[] }),
        getDocs(query(usersRef, where("role", "==", "prof"))),
        Promise.resolve({ docs: [] } as { docs: never[] }),
      ]);

  const profsMap = new Map<string, Professeur>();

  // Add professeurs docs (with or without schoolId)
  [...profsSnap.docs, ...profsNoSchoolSnap.docs].forEach((d) => {
    if (!profsMap.has(d.id)) profsMap.set(d.id, { id: d.id, ...(d.data() as Professeur) });
  });

  // Track professeurIds already covered by professeurs docs
  const coveredProfIds = new Set<string>(profsMap.keys());

  // Synthesize Professeur entries for users with role=prof who don't have a professeurs doc
  [...usersProfsSnap.docs, ...usersProfsNoSchoolSnap.docs].forEach((d) => {
    const u = d.data();
    const professeurId = u.professeurId as string | undefined;
    // Skip if already covered by an existing professeurs doc
    if (professeurId && coveredProfIds.has(professeurId)) return;
    if (profsMap.has(d.id)) return;

    profsMap.set(d.id, {
      id: d.id,
      nom: (u.nom as string) || "",
      prenom: (u.prenom as string) || "",
      matieres: [],
      classes: (u.classesEnseignees as string[]) || [],
      statut: (u.isActive !== false) ? "actif" : "inactif",
    });
  });

  return Array.from(profsMap.values());
}

export async function getProfesseurById(id: string): Promise<Professeur | null> {
  const ref = doc(db, "professeurs", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Professeur) };
}

/* ======================
   UPDATE
====================== */

export async function updateProfesseur(id: string, data: Partial<Professeur>) {
  const ref = doc(db, "professeurs", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* ======================
   SOFT DELETE
====================== */

export async function desactiverProfesseur(id: string) {
  const ref = doc(db, "professeurs", id);
  await updateDoc(ref, {
    statut: "inactif",
    updatedAt: serverTimestamp(),
  });
}
