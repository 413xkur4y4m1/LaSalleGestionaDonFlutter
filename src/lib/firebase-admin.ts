import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

if (!admin.apps.length) {
  let serviceAccount: any;

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // ✅ Producción: usar variable de entorno
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
      // ✅ Desarrollo local: leer archivo
      const jsonPath = path.join(process.cwd(), "firebase-service-account.json");
      if (!fs.existsSync(jsonPath)) {
        throw new Error(
          "No se encontró el archivo firebase-service-account.json en la raíz del proyecto."
        );
      }
      serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    }

    // 🔹 Normalizar saltos de línea de la clave privada
    const rawPrivateKey = serviceAccount.private_key;
    const privateKey = rawPrivateKey.replace(/\\n/g, "\n").replace(/\r?\n/g, "\n");

    // ✅ Inicializar Firebase Admin con las claves correctas
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey,
      }),
    });

  } catch (error) {
    console.error("❌ Error al inicializar Firebase Admin:", error);
    throw new Error(
      "Error al inicializar Firebase Admin. Revisa tu FIREBASE_SERVICE_ACCOUNT_KEY."
    );
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
