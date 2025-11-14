// File: src/lib/firestore-operations-server.ts
import { adminDb } from "./firebase-admin";

export function getDb() {
  return adminDb;
}

/**
 * Crea o actualiza un estudiante en Firestore.
 * Extrae automáticamente el grupo desde el correo.
 */
export const createOrUpdateStudentServer = async (user: {
  id: string;
  email: string;
  name?: string;
  image?: string;
}) => {
  const db = getDb();

  const extractGrupoFromEmail = (email: string): string => {
    if (!email.endsWith("@ulsaneza.edu.mx")) return "";
    const username = email.split("@")[0];
    const parts = username.split(".");
    if (parts.length < 2) return "";
    const potentialGroup = parts[parts.length - 1].toUpperCase();
    return /^\d{2,4}[A-Z]?$/.test(potentialGroup) ? potentialGroup : "";
  };

  const studentRef = db.collection("Estudiantes").doc(user.id);
  const studentSnap = await studentRef.get();

  if (!studentSnap.exists) {
    const grupo = extractGrupoFromEmail(user.email);
    await studentRef.set({
      uid: user.id,
      nombre: user.name || "",
      correo: user.email,
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
