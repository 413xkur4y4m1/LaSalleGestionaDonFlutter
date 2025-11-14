
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';

export async function GET() {
  // Este endpoint debería estar protegido para que solo se ejecute de forma programada (CRON job)
  // Por ahora, lo dejamos abierto para pruebas.
  console.log("\n--- [CRON JOB INICIADO]: Verificando préstamos vencidos ---");
  const db = getDb();
  const FieldValue = admin.firestore.FieldValue;

  try {
    // 1. Obtenemos todos los documentos de la colección raíz 'Estudiantes'
    const studentsSnapshot = await db.collection('Estudiantes').get();
    
    if (studentsSnapshot.empty) {
      console.log("[CRON JOB]: No se encontraron estudiantes.");
      return NextResponse.json({ message: "No se encontraron estudiantes." });
    }

    let processedCount = 0;
    const now = new Date();

    // 2. Iteramos sobre cada estudiante
    for (const studentDoc of studentsSnapshot.docs) {
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();
      console.log(`[CRON JOB]: Verificando estudiante: ${studentData.nombre} (${studentId})`);

      // 3. Apuntamos a la subcolección de Préstamos de cada estudiante
      const loansRef = studentDoc.ref.collection('Prestamos');
      const activeLoansQuery = loansRef.where('estado', '==', 'activo');
      const loansSnapshot = await activeLoansQuery.get();

      if (loansSnapshot.empty) {
        // console.log(` -> No tiene préstamos activos.`);
        continue; // Pasamos al siguiente estudiante
      }

      // 4. Iteramos sobre los préstamos activos del estudiante
      for (const loanDoc of loansSnapshot.docs) {
        const loanData = loanDoc.data();
        const returnDate = (loanData.fechaDevolucion as admin.firestore.Timestamp).toDate();

        // 5. ¡LA LÓGICA CLAVE! Comparamos si la fecha de devolución ya pasó
        if (returnDate < now) {
          console.log(` -> ¡VENCIDO! Préstamo ${loanDoc.id} (${loanData.nombreMaterial}).`);
          processedCount++;

          const adeudoRef = studentDoc.ref.collection('Adeudos').doc(loanDoc.id);

          // Creamos una transacción para mover el préstamo a adeudos de forma atómica
          await db.runTransaction(async (transaction) => {
            // Copiamos los datos al nuevo documento de adeudo
            transaction.set(adeudoRef, {
              ...loanData,
              estado: 'adeudo', // Actualizamos el estado
              fechaVencimiento: loanData.fechaDevolucion, // Mantenemos la fecha original
              notificado: false, // Añadimos un campo para futuras notificaciones
            });
            // Eliminamos el documento original de la colección de préstamos
            transaction.delete(loanDoc.ref);
          });
          console.log(`   -> Movido a Adeudos exitosamente.`);
        }
      }
    }

    console.log(`--- [CRON JOB FINALIZADO]: ${processedCount} préstamos procesados. ---\n`);
    if (processedCount > 0) {
        return NextResponse.json({ message: `Proceso completado. ${processedCount} préstamos se movieron a adeudos.` });
    }
    return NextResponse.json({ message: "Proceso completado. No se encontraron préstamos vencidos." });

  } catch (error: any) {
    console.error("[CRON JOB ERROR]:", error);
    return NextResponse.json({ message: "Error durante la ejecución del proceso CRON.", error: error.message }, { status: 500 });
  }
}
