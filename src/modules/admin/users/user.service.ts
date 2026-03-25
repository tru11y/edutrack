import { collection, getDocs, updateDoc, doc, query, where, limit } from "firebase/firestore";
import { db } from "../../../services/firebase";
import type { UserRole } from "../../../types/User";

export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
}

export const getAllUsers = async (schoolId?: string | null) => {
  const q = schoolId
    ? query(collection(db, "users"), where("schoolId", "==", schoolId), limit(200))
    : query(collection(db, "users"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createUserProfile = async (uid: string, data: CreateUserInput) => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    isActive: true,
    createdAt: new Date(),
  });
};
