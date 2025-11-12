import * as admin from "firebase-admin";
import path from "path";
import fs from "fs";

if (!admin.apps.length) {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Producción: usa la variable de entorno
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  } else {
    // Desarrollo: lee el JSON local
    const jsonPath = path.join(process.cwd(), "firebase-service-account.json");
    if (!fs.existsSync(jsonPath)) {
      throw new Error("No se encontró el archivo firebase-service-account.json en la raíz del proyecto.");
    }
    serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      // Reemplaza correctamente los \n
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
