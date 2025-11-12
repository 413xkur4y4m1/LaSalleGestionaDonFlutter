import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export const getStudentData = async (uid: string) => {
  const docRef = doc(db, "Estudiantes", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const updateStudentGrupo = async (uid: string, grupo: string) => {
  const studentRef = doc(db, "Estudiantes", uid);
  await updateDoc(studentRef, { grupo: grupo.toUpperCase() });
};

export const createLoan = async (uid: string, loanData: any) => {
  const loansCollectionRef = collection(db, "Estudiantes", uid, "Prestamos");
  return await addDoc(loansCollectionRef, { ...loanData, createdAt: serverTimestamp() });
};
