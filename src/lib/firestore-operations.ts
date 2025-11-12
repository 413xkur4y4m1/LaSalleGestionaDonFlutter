import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

interface StudentData {
  uid: string;
  nombre: string;
  correo: string;
  rol: string;
  grupo: string;
  carrera: string;
  fotoPerfil: string;
  createdAt: any; // Use any for Timestamp or Date
  lastLogin: any; // Use any for Timestamp or Date
}

interface LoanData {
  codigo: string;
  nombreMaterial: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  fechaInicio: any;
  fechaDevolucion: any;
  estado: string;
  grupo: string;
  createdAt: any;
}

export const getStudentData = async (uid: string): Promise<StudentData | null> => {
  const docRef = doc(db, "Estudiantes", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as StudentData;
  } else {
    return null;
  }
};

export const createOrUpdateStudent = async (user: any) => {
  const studentRef = doc(db, "Estudiantes", user.id);
  const studentSnap = await getDoc(studentRef);

  const isNewUser = !studentSnap.exists();
  let needsGrupo = false;

  if (isNewUser) {
    await setDoc(studentRef, {
      uid: user.id,
      nombre: user.name || "",
      correo: user.email || "",
      rol: "estudiante",
      grupo: "", // Empty on creation, to be filled by modal
      carrera: "turismo", // Default value as per spec
      fotoPerfil: user.image || "",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    needsGrupo = true;
  } else {
    await updateDoc(studentRef, {
      lastLogin: serverTimestamp(),
    });
    const data = studentSnap.data();
    if (!data?.grupo) {
      needsGrupo = true;
    }
  }

  return { isNewUser, needsGrupo };
};

export const updateStudentGrupo = async (uid: string, grupo: string) => {
  const studentRef = doc(db, "Estudiantes", uid);
  await updateDoc(studentRef, {
    grupo: grupo.toUpperCase(),
  });
};

export const createLoan = async (uid: string, loanData: any) => {
  const loansCollectionRef = collection(db, "Estudiantes", uid, "Prestamos");
  const docRef = await addDoc(loansCollectionRef, {
    ...loanData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};