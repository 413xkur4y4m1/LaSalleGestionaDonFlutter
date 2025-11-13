// File: src/lib/firestore-operations-server.ts
import * as admin from "firebase-admin";

// 🔹 Lazy initialization de Firebase Admin
function getAdmin() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no está definido en el entorno.");
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const privateKey = serviceAccount.private_key
      .replace(/\\n/g, "\n")  // reemplaza \n escapados
      .replace(/\r?\n/g, "\n"); // normaliza saltos de línea reales

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey,
      }),
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
      // ✨ Campos añadidos para coincidir con tu estructura ✨
      prestamos: [],
      adeudos: [],
      pagos: [],
      completados: [],
    });
  } else {
    await studentRef.update({ lastLogin: new Date() });
  }
};
