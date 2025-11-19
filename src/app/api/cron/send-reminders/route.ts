
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  console.log("\n--- [CRON | send-reminders]: Buscando préstamos por vencer... ---");
  const db = getDb();
  let remindersSentCount = 0;
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Próximas 24 horas

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    if (studentsSnapshot.empty) {
      return NextResponse.json({ message: "No se encontraron estudiantes." });
    }

    const reminderPromises = [];

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const loansRef = studentDoc.ref.collection('Prestamos');
      const notificationsRef = studentDoc.ref.collection('Notificaciones');
      
      // 1. --- BUSCAMOS PRÉSTAMOS ACTIVOS QUE VENCEN PRONTO ---
      const reminderQuery = loansRef
        .where('estado', '==', 'activo')
        .where('fechaDevolucion', '>=', now)
        .where('fechaDevolucion', '<=', reminderWindow);

      const loansSnapshot = await reminderQuery.get();
      if (loansSnapshot.empty) continue;

      console.log(`[CRON | s-rem]: Estudiante ${studentData.nombre || studentDoc.id} tiene ${loansSnapshot.size} préstamos por vencer.`);

      for (const loanDoc of loansSnapshot.docs) {
        const loanData = loanDoc.data();
        const prestamoId = loanDoc.id;

        // 2. --- VERIFICAMOS QUE NO EXISTA UN RECORDATORIO PREVIO ---
        const checkPromise = notificationsRef
          .where('tipo', '==', 'recordatorio')
          .where('prestamoId', '==', prestamoId)
          .limit(1)
          .get()
          .then(existingNotifSnap => {
            if (!existingNotifSnap.empty) {
              console.log(` -> Recordatorio para préstamo ${prestamoId} ya fue enviado. Saltando.`);
              return; // Si ya existe, no hacemos nada
            }

            // 3. --- SI NO EXISTE, CREAMOS LA NUEVA NOTIFICACIÓN ---
            console.log(` -> Preparando recordatorio para préstamo ${prestamoId} (${loanData.nombreMaterial}).`);
            remindersSentCount++;
            return notificationsRef.add({
              tipo: 'recordatorio',
              prestamoId: prestamoId,
              mensaje: `⏰ RECORDATORIO: Tu préstamo de ${loanData.nombreMaterial || 'material'} vence pronto. Por favor devuélvelo a tiempo.`,
              enviado: true,
              fechaEnvio: admin.firestore.Timestamp.now(),
              canal: 'interno',
              leida: false
            });
          });
        
        reminderPromises.push(checkPromise);
      }
    }

    await Promise.all(reminderPromises);

    console.log(`--- [CRON | send-reminders]: Finalizado. ${remindersSentCount} recordatorios enviados. ---\n`);
    return NextResponse.json({ message: `Proceso completado. Se enviaron ${remindersSentCount} recordatorios.` });

  } catch (error: any) {
    console.error("[CRON | send-reminders ERROR]:", error);
    return NextResponse.json({ message: "Error durante la ejecución del proceso CRON.", error: error.message }, { status: 500 });
  }
}
