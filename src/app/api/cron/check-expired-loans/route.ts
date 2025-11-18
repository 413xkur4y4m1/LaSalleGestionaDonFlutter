
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';
import { headers } from 'next/headers';

export async function GET() {
  // 1. --- ¡SEGURIDAD PRIMERO! ---
  // Verificamos que la petición venga de nuestro servicio de CRON y no de un usuario cualquiera.
  const headersList = headers();
  const authHeader = headersList.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON JOB ERROR]: La variable de entorno CRON_SECRET no está configurada.");
    return NextResponse.json({ message: "Configuración de servidor incompleta." }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[CRON JOB-CEXP]: Intento de acceso no autorizado.");
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }
  
  console.log("\n--- [CRON | check-expired-loans]: Verificando préstamos vencidos... ---");
  const db = getDb();

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    
    if (studentsSnapshot.empty) {
      console.log("[CRON | check-expired-loans]: No se encontraron estudiantes.");
      return NextResponse.json({ message: "No se encontraron estudiantes." });
    }

    let processedCount = 0;
    const now = new Date();
    const promises = [];

    // 2. Iteramos sobre cada estudiante de forma más eficiente
    for (const studentDoc of studentsSnapshot.docs) {
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();

      const loansRef = studentDoc.ref.collection('Prestamos');
      // Buscamos préstamos activos cuya fecha de devolución sea menor a la actual
      const expiredLoansQuery = loansRef
        .where('estado', '==', 'activo')
        .where('fechaDevolucion', '<', now);
        
      const promise = expiredLoansQuery.get().then(loansSnapshot => {
        if (loansSnapshot.empty) return;

        console.log(`[CRON | c-exp]: Estudiante ${studentData.nombre || studentId} tiene ${loansSnapshot.size} préstamos vencidos.`);

        // Procesamos cada préstamo vencido encontrado
        for (const loanDoc of loansSnapshot.docs) {
          processedCount++;
          const loanData = loanDoc.data();
          console.log(` -> Procesando préstamo ${loanDoc.id} (${loanData.nombreMaterial}).`);
          
          const adeudoRef = studentDoc.ref.collection('Adeudos').doc(loanDoc.id);

          // Transacción atómica para garantizar la integridad de los datos
          const transactionPromise = db.runTransaction(async (transaction) => {
            transaction.set(adeudoRef, {
              ...loanData,
              estado: 'adeudo', // El estado cambia a 'adeudo'
              fechaVencimiento: loanData.fechaDevolucion,
              formSent: false, // ¡NUEVO! Campo para controlar el envío del formulario
            });
            transaction.delete(loanDoc.ref);
          });
          return transactionPromise;
        }
      });
      promises.push(promise);
    }

    await Promise.all(promises);

    console.log(`--- [CRON | check-expired-loans]: Finalizado. ${processedCount} préstamos movidos a adeudos. ---\n`);
    if (processedCount > 0) {
        return NextResponse.json({ message: `Proceso completado. ${processedCount} préstamos se movieron a adeudos.` });
    }
    return NextResponse.json({ message: "Proceso completado. No se encontraron préstamos vencidos." });

  } catch (error: any) {
    console.error("[CRON | check-expired-loans ERROR]:", error);
    return NextResponse.json({ message: "Error durante la ejecución del proceso CRON.", error: error.message }, { status: 500 });
  }
}
