// File: src/lib/firebase-admin.ts
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

/**
 * 🔹 Inicialización Lazy de Firebase Admin
 * Protege contra múltiples inicializaciones.
 */
export function initializeAdmin() {
  if (!admin.apps.length) {
    let serviceAccount: any;

    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // ✅ Producción: variable de entorno en Base64
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "base64").toString("utf-8");
        serviceAccount = JSON.parse(decoded.replace(/\\n/g, "\n"));
      } else {
        // ✅ Desarrollo local: leer archivo JSON
        const jsonPath = path.join(process.cwd(), "firebase-service-account.json");
        if (!fs.existsSync(jsonPath)) {
          throw new Error("No se encontró firebase-service-account.json en la raíz del proyecto.");
        }
        serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      }

      // Normalizar saltos de línea de la clave privada
      const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n").replace(/\r?\n/g, "\n");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey,
        }),
      });
    } catch (error) {
      console.error("❌ Error al inicializar Firebase Admin:", error);
      throw new Error("Error al inicializar Firebase Admin. Revisa tu FIREBASE_SERVICE_ACCOUNT_KEY.");
    }
  }

  return admin;
}

// 🔹 Exportar servicios
export const adminDb = initializeAdmin().firestore();
export const adminAuth = initializeAdmin().auth();
