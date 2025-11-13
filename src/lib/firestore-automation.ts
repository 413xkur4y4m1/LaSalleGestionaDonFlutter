
import * as admin from "firebase-admin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore"; // Importamos el tipo para los documentos
import { sendOverdueLoanEmail } from "./email-server";

// Re-usable function to initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables.");
    }
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin;
}

/**
 * Checks all active loans for all students, creates adeudos, and sends emails for overdue ones.
 */
export async function handleOverdueLoans() {
  const admin = initializeFirebaseAdmin();
  const db = admin.firestore();
  const now = new Date();
  let overdueCount = 0;

  console.log("CRON JOB: Starting check for overdue loans...");

  const studentsSnapshot = await db.collection("Estudiantes").get();

  // Añadimos el tipo explícito a studentDoc para satisfacer a TypeScript
  const processingPromises = studentsSnapshot.docs.map(async (studentDoc: QueryDocumentSnapshot) => {
    const studentUid = studentDoc.id;
    const studentData = studentDoc.data();
    
    const loansRef = db.collection("Estudiantes").doc(studentUid).collection("Prestamos");
    const overdueLoansQuery = loansRef.where("estado", "==", "activo").where("fechaDevolucion", "<=", admin.firestore.Timestamp.fromDate(now));
    
    const overdueLoansSnapshot = await overdueLoansQuery.get();

    if (overdueLoansSnapshot.empty) {
      return;
    }

    for (const loanDoc of overdueLoansSnapshot.docs) {
      const loanData = loanDoc.data();
      const prestamoId = loanDoc.id;

      console.log(`Found overdue loan ${prestamoId} for student ${studentUid}`);

      // 1. Create Adeudo
      const adeudoCode = `ADEU-${studentData.grupo || 'S/G'}-${Date.now().toString().slice(-5)}`;
      const newAdeudo = {
        cantidad: loanData.cantidad,
        codigo: adeudoCode,
        estado: "pendiente",
        fechaVencimiento: loanData.fechaDevolucion,
        grupo: studentData.grupo,
        moneda: "MXN",
        nombreMaterial: loanData.nombreMaterial,
        precio_ajustado: loanData.precio_total,
        precio_unitario: loanData.precio_unitario,
        tipo: "retraso",
        prestamoId: prestamoId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const adeudoRef = await db.collection("Estudiantes").doc(studentUid).collection("Adeudos").add(newAdeudo);
      console.log(`Created Adeudo ${adeudoRef.id} for loan ${prestamoId}`);

      // 2. Create In-App Notification
      const newNotification = {
        enviado: true,
        fechaEnvio: admin.firestore.FieldValue.serverTimestamp(),
        mensaje: `Se ha generado un adeudo por no devolver: ${loanData.nombreMaterial}.`,
        link: "/dashboard/adeudos",
        tipo: "nuevo_adeudo",
        leido: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("Estudiantes").doc(studentUid).collection("Notificaciones").add(newNotification);
      console.log(`Created In-App Notification for student ${studentUid}`);

      // 3. Send Email Notification
      if (studentData.correo && studentData.nombre) {
        await sendOverdueLoanEmail({
            studentName: studentData.nombre,
            studentEmail: studentData.correo,
            materialName: loanData.nombreMaterial,
            loanDate: loanData.fechaInicio.toDate(),
            returnDate: loanData.fechaDevolucion.toDate(),
        });
      } else {
        console.warn(`Skipping email for student ${studentUid}: missing email or name.`);
      }

      // 4. Update loan status to "vencido"
      await loanDoc.ref.update({ estado: "vencido" });
      console.log(`Updated loan ${prestamoId} status to "vencido"`);

      overdueCount++;
    }
  });

  await Promise.all(processingPromises);

  console.log(`CRON JOB: Finished. Processed ${overdueCount} overdue loan(s).`);
  return { processedLoans: overdueCount };
}
