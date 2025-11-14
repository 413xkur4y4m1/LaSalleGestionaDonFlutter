// File: src/lib/firestore-operations-server.ts
import * as admin from "firebase-admin";

// 🔹 Lazy initialization de Firebase Admin
function getAdmin() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no está definido en el entorno.");
    }

    // Decodificar la clave de servicio de Base64
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

export const createOrUpdateStudentServer = async (user: any) => {
  const adminInstance = getAdmin();
  const db = adminInstance.firestore();

  const studentRef = db.collection("Estudiantes").doc(user.id);
  const studentSnap = await studentRef.get();

  if (!studentSnap.exists) {
    await studentRef.set({
      uid: user.id,
      nombre: user.name || "",
      correo: user.email || "",
      rol: "estudiante",
      grupo: "",
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
