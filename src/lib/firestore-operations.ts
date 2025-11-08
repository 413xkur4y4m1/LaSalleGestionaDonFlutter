// src/lib/firestore-operations.ts
import { db } from './firebase'; // <-- VERIFICA ESTA RUTA EXACTA

import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface StudentData {
  grupo?: string;
  [key: string]: any;
}

// Obtiene los datos de un estudiante por su userId
export async function getStudentData(userId: string): Promise<StudentData | null> {
  const docRef = doc(db, 'students', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as StudentData;
  }
  return null;
}

export async function updateStudentGrupo(userId: string, grupo: string): Promise<void> {
  const docRef = doc(db, 'students', userId);
  await updateDoc(docRef, { grupo });
}

