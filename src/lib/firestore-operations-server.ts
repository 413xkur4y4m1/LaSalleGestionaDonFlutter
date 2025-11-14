// File: src/lib/firestore-operations-server.ts
import * as admin from "firebase-admin";

// 🔹 Función de inicialización Lazy de Firebase Admin
function initializeAdmin() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no está definido en el entorno.");
    }

    // Decodificar la clave de servicio de Base64, que es más robusto
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      "base64"
    ).toString("utf-8");
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}

/**
 * Obtiene la instancia de la base de datos de Firestore del lado del servidor.
 * Usa la inicialización de Admin SDK.
 */
export function getDb() {
  return initializeAdmin().firestore();
}

/**
 * Crea un nuevo estudiante en Firestore si no existe, o actualiza su fecha de último login.
 * Extrae el grupo del correo electrónico del estudiante.
 */
export const createOrUpdateStudentServer = async (user: any) => {
  const db = getDb();

  // Lógica para extraer el grupo desde el email (ej: roberto.perez.103m@ulsaneza.edu.mx)
  const extractGrupoFromEmail = (email: string): string => {
    if (!email || !email.endsWith("@ulsaneza.edu.mx")) return "";
    const username = email.split('@')[0];
    const parts = username.split('.');
    if (parts.length < 2) return ""; // No hay suficiente información
    
    const potentialGroup = parts[parts.length - 1].toUpperCase();
    // Un regex simple para validar que parece un grupo (ej: 101, 203M, 1101A)
    if (/^\d{2,4}[A-Z]?$/.test(potentialGroup)) {
      return potentialGroup;
    }
    return "";
  };

  const studentRef = db.collection("Estudiantes").doc(user.id);
  const studentSnap = await studentRef.get();

  if (!studentSnap.exists) {
    const grupo = extractGrupoFromEmail(user.email);
    await studentRef.set({
      uid: user.id,
      nombre: user.name || "",
      correo: user.email || "",
      rol: "estudiante",
      grupo: grupo, // Asignamos el grupo extraído
      carrera: "turismo",
      fotoPerfil: user.image || "",
      createdAt: new Date(),
      lastLogin: new Date(),
      prestamos: [],
      adeudos: [],
      pagos: [],
      completados: [],
    });
  } else {
    await studentRef.update({ lastLogin: new Date() });
  }
};
