import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';


export interface StudentData {
  uid: string;
  nombre: string;
  correo: string;
  rol: string;
  grupo: string;
  carrera: string;
  fotoPerfil: string;
  createdAt: any;
  lastLogin: any;
}
// Check if student document exists and has grupo
export async function getStudentData(uid: string): Promise<StudentData | null> {
  const studentRef = doc(db, 'Estudiantes', uid);
  const studentSnap = await getDoc(studentRef);

  if (!studentSnap.exists()) {
    return null;
  }

  return studentSnap.data() as StudentData;
}

// Create or update student document
export async function createOrUpdateStudent(user: any) {
  const studentRef = doc(db, 'Estudiantes', user.uid);
  const studentSnap = await getDoc(studentRef);

  if (!studentSnap.exists()) {
    // Create new student
    await setDoc(studentRef, {
      uid: user.uid,
      nombre: user.displayName || '' , // Access displayName property
      correo: user.email || '',
      rol: 'estudiante',
      grupo: '', // Empty initially
      carrera: 'turismo',
      fotoPerfil: user.photoURL || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    return { isNew: true, needsGrupo: true };
  } else {
    // Update last login
    await updateDoc(studentRef, {
      lastLogin: serverTimestamp()
    });

    const data = studentSnap.data();
    return {
      isNew: false,
      needsGrupo: !data.grupo || data.grupo === ''
    };
  }
}


// Update student grupo
export async function updateStudentGrupo(uid: string, grupo: string) {
  const studentRef = doc(db, 'Estudiantes', uid);

  await updateDoc(studentRef, {
    grupo: grupo.toUpperCase()
  });
}

// Create loan in Firestore
export async function createLoan(uid: string, loanData: any) {
  const loansRef = collection(db, 'Estudiantes', uid, 'Prestamos');
  const newLoanRef = doc(loansRef);

  await setDoc(newLoanRef, {
    ...loanData,
    createdAt: serverTimestamp()
  });

  return newLoanRef.id;
}