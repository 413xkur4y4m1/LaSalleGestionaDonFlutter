import { db } from "@/lib/firebase-config";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, Timestamp, getDocs, query, where } from "firebase/firestore";

// --- INTERFACES ---

export interface StudentData {
  uid: string;
  nombre: string;
  correo: string;
  rol: "estudiante" | "admin";
  grupo: string;
  carrera: string;
  fotoPerfil: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  prestamos: string[];
  adeudos: string[];
  pagos: string[];
  completados: string[];
}

export interface PrestamoData {
  id?: string; // Opcional, para incluir el ID del documento
  cantidad: number;
  codigo: string;
  estado: "activo" | "vencido" | "devuelto";
  fechaDevolucion: Timestamp;
  fechaInicio: Timestamp;
  grupo: string;
  nombreMaterial: string;
  precio_total: number;
  precio_unitario: number;
  createdAt: Timestamp;
}

export interface AdeudoData {
  id?: string;
  cantidad: number;
  codigo: string;
  estado: "pendiente" | "pagado";
  fechaVencimiento: Timestamp;
  grupo: string;
  moneda: "MXN";
  nombreMaterial: string;
  precio_ajustado: number;
  precio_unitario: number;
  tipo: "rotura" | "perdida" | "retraso";
  prestamoId: string; // Vínculo al préstamo original
  createdAt: Timestamp;
}

export interface PagoData {
  id?: string;
  codigoPago: string;
  estado: "pagado";
  fechaPago: Timestamp;
  metodo: "en línea" | "efectivo";
  nombreMaterial: string;
  precio: number;
  adeudoId: string; // Vínculo al adeudo original
  createdAt: Timestamp;
}

export interface NotificacionData {
  id?: string;
  enviado: boolean;
  fechaEnvio: Timestamp;
  mensaje: string;
  link?: string; // Link a la página relevante (e.g., mis adeudos)
  tipo: "recordatorio" | "vencimiento" | "confirmacion_pago" | "nuevo_adeudo";
  leido: boolean;
  createdAt: Timestamp;
}


// --- OPERACIONES DE ESTUDIANTES (COLECCIÓN RAÍZ) ---

export const getStudentData = async (uid: string): Promise<StudentData | null> => {
  const docRef = doc(db, "Estudiantes", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() as StudentData : null;
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
      grupo: "",
      carrera: "turismo",
      fotoPerfil: user.image || "",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      prestamos: [],
      adeudos: [],
      pagos: [],
      completados: [],
    });
    needsGrupo = true;
  } else {
    await updateDoc(studentRef, { lastLogin: serverTimestamp() });
    const data = studentSnap.data();
    if (!data?.grupo) needsGrupo = true;
  }
  return { isNewUser, needsGrupo };
};

export const updateStudentGrupo = async (uid: string, grupo: string) => {
  const studentRef = doc(db, "Estudiantes", uid);
  await updateDoc(studentRef, { grupo: grupo.toUpperCase() });
};


// --- OPERACIONES DE SUB-COLECCIONES (CLIENT-SIDE) ---

const createDocumentInSubcollection = async (studentUid: string, subcollectionName: string, data: object) => {
  const subcollectionRef = collection(db, "Estudiantes", studentUid, subcollectionName);
  const docData = { ...data, createdAt: serverTimestamp() };
  const docRef = await addDoc(subcollectionRef, docData);
  return docRef.id;
};

export const createPrestamo = (studentUid: string, data: Omit<PrestamoData, 'createdAt' | 'id'>) => 
  createDocumentInSubcollection(studentUid, "Prestamos", data);

export const getNotifications = async (studentUid: string): Promise<NotificacionData[]> => {
    const notificationsRef = collection(db, "Estudiantes", studentUid, "Notificaciones");
    const q = query(notificationsRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificacionData));
}

export const markNotificationAsRead = async (studentUid: string, notificationId: string) => {
    const notificationRef = doc(db, "Estudiantes", studentUid, "Notificaciones", notificationId);
    await updateDoc(notificationRef, { leido: true });
}
