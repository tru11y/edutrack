import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../services/firebase";
import type { UserRole } from "../../../types/User";

export interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
}

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createUserProfile = async (uid: string, data: CreateUserInput) => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    isActive: true,
    createdAt: new Date(),
  });
};
