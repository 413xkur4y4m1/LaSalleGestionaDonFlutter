// File: src/lib/firestore-operations-server.ts
import * as admin from "firebase-admin";

/**
 * 🔹 Inicialización lazy de Firebase Admin.
 * Protege contra múltiples inicializaciones.
 * Convierte los "\n" literales en saltos de línea reales.
 */
function initializeAdmin() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY no está definido en las variables de entorno."
      );
    }

    // Decodificar Base64
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      "base64"
    ).toString("utf-8");

    // Reemplazar "\n" literales por saltos de línea reales
    const serviceAccount = JSON.parse(
      serviceAccountJson.replace(/\\n/g, "\n")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return admin;
}

/**
 * Obtiene la instancia de Firestore del lado del servidor.
 */
export function getDb() {
  return initializeAdmin().firestore();
}

/**
 * Crea o actualiza un estudiante en Firestore.
 * Extrae automáticamente el grupo desde el correo.
 */
export const createOrUpdateStudentServer = async (user: any) => {
  const db = getDb();

  const extractGrupoFromEmail = (email: string): string => {
    if (!email || !email.endsWith("@ulsaneza.edu.mx")) return "";
    const username = email.split("@")[0];
    const parts = username.split(".");
    if (parts.length < 2) return "";

    const potentialGroup = parts[parts.length - 1].toUpperCase();
    if (/^\d{2,4}[A-Z]?$/.test(potentialGroup)) return potentialGroup;
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
      grupo,
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
