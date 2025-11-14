
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// --- INICIALIZACIÓN DE FIREBASE ADMIN (SIN CAMBIOS) ---
function initializeAdmin() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY_B64 no está definido en el entorno.");
    }
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64,
      "base64"
    ).toString("utf-8");
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}

export function getDb() {
  return initializeAdmin().firestore();
}

// --- TIPADO PARA EL OBJETO DE USUARIO ---
interface StudentData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  rol: string;
  grupo: string | null;
}

// --- FUNCIÓN REFACTORIZADA ---
/**
 * Crea un nuevo estudiante si no existe, o actualiza sus datos si ya existe.
 * ✅ Ahora también inicializa las subcolecciones requeridas para un nuevo estudiante.
 */
export const createOrUpdateStudentServer = async (user: StudentData) => {
  const db = getDb();

  if (!user.id) {
    throw new Error("Se requiere un ID de usuario para crear o actualizar el estudiante.");
  }

  const studentRef = db.collection("Estudiantes").doc(user.id);
  const studentSnap = await studentRef.get();

  if (!studentSnap.exists) {
    // --- CREAR NUEVO ESTUDIANTE ---
    console.log(`Creando nuevo estudiante con id: ${user.id}`);
    await studentRef.set({
      uid: user.id,
      nombre: user.name ?? "",
      correo: user.email ?? "",
      rol: user.rol,
      grupo: user.grupo, // Será null si no se pudo extraer del email
      carrera: "turismo",
      fotoPerfil: user.image ?? "",
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: FieldValue.serverTimestamp(),
      prestamos: [],
      adeudos: [],
      pagos: [],
      completados: [],
    });
    
    // ✅ **NUEVO: Inicializa las subcolecciones**
    console.log(`Inicializando subcolecciones para el estudiante: ${user.id}`);
    const subcollections = ["Prestamos", "Adeudos", "Pagados", "Completados", "Formularios", "Notificaciones"];
    const placeholder = {
        initializedAt: FieldValue.serverTimestamp(),
        _info: "This document is a placeholder to initialize the collection."
    };

    for (const subcollection of subcollections) {
        await studentRef.collection(subcollection).doc("_placeholder").set(placeholder);
    }
    console.log(`Subcolecciones inicializadas con éxito para ${user.id}`);

  } else {
    // --- ACTUALIZAR ESTUDIANTE EXISTENTE ---
    console.log(`Actualizando datos para el estudiante existente: ${user.id}`);
    await studentRef.update({
      nombre: user.name ?? "",
      fotoPerfil: user.image ?? "",
      lastLogin: FieldValue.serverTimestamp(),
    });
  }
};
