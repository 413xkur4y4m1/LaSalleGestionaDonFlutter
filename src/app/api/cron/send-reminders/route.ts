
import { NextRequest, NextResponse } from 'next/server'; // <-- FIX: Importar NextRequest
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';

// FIX: La función ahora acepta el objeto `request`
export async function GET(request: NextRequest) { 
  // 1. --- ¡SEGURIDAD PRIMERO! (FORMA CORREGIDA) ---
  const authHeader = request.headers.get('authorization'); // <-- FIX: Leer headers desde request
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON JOB ERROR]: La variable de entorno CRON_SECRET no está configurada.");
    return NextResponse.json({ message: "Configuración de servidor incompleta." }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[CRON | send-reminders]: Intento de acceso no autorizado.");
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  console.log("\n--- [CRON | send-reminders]: Buscando préstamos por vencer... ---");
  const db = getDb();
  const FieldValue = admin.firestore.FieldValue;

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    if (studentsSnapshot.empty) {
      return NextResponse.json({ message: "No se encontraron estudiantes." });
    }

    let remindersSentCount = 0;
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas desde ahora

    const promises = [];

    for (const studentDoc of studentsSnapshot.docs) {
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();

      const loansRef = studentDoc.ref.collection('Prestamos');
      
      // Query para préstamos activos, que vencen en las próximas 24h y sin recordatorio enviado
      const reminderQuery = loansRef
        .where('estado', '==', 'activo')
        .where('fechaDevolucion', '>=', now)
        .where('fechaDevolucion', '<=', reminderWindow)
        .where('reminderSent', '==', false);

      const promise = reminderQuery.get().then(loansSnapshot => {
        if (loansSnapshot.empty) return;

        console.log(`[CRON | s-rem]: Estudiante ${studentData.nombre || studentId} tiene ${loansSnapshot.size} préstamos por vencer.`);

        for (const loanDoc of loansSnapshot.docs) {
          const loanData = loanDoc.data();
          console.log(` -> Preparando recordatorio para préstamo ${loanDoc.id} (${loanData.nombreMaterial}).`);

          const notificationRef = studentDoc.ref.collection('Notifications').doc(`reminder_${loanDoc.id}`);
          const loanRef = loanDoc.ref;

          // Transacción para asegurar que se cree la notificación Y se marque el préstamo
          const transactionPromise = db.runTransaction(async (transaction) => {
            // 1. Crear la notificación para el estudiante
            transaction.set(notificationRef, {
              type: 'reminder_due',
              message: `Tu préstamo de ${loanData.cantidad} ${loanData.nombreMaterial} vence pronto. ¡No olvides devolverlo!`,
              loanCode: loanDoc.id, // El código para generar el QR en el frontend
              timestamp: FieldValue.serverTimestamp(),
              read: false,
            });

            // 2. Marcar el préstamo para no enviar más recordatorios
            transaction.update(loanRef, { reminderSent: true });
          });
          remindersSentCount++;
          return transactionPromise;
        }
      });
      promises.push(promise);
    }

    await Promise.all(promises);

    console.log(`--- [CRON | send-reminders]: Finalizado. ${remindersSentCount} recordatorios enviados. ---\n`);
    return NextResponse.json({ message: `Proceso completado. Se enviaron ${remindersSentCount} recordatorios.` });

  } catch (error: any) {
    console.error("[CRON | send-reminders ERROR]:", error);
    return NextResponse.json({ message: "Error durante la ejecución del proceso CRON.", error: error.message }, { status: 500 });
  }
}
