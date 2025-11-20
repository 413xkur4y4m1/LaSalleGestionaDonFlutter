import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  // ✅ CORRECCIÓN: Vercel envía "Authorization" con mayúscula
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  console.log('🔍 Debug Auth:', {
    receivedHeader: authHeader ? 'Presente' : 'Ausente',
    expectedSecret: cronSecret ? 'Configurado' : 'NO CONFIGURADO',
    match: authHeader === `Bearer ${cronSecret}`
  });

  if (!cronSecret) {
    console.error('❌ CRON_SECRET no está configurado en las variables de entorno');
    return NextResponse.json({ 
      message: "Error de configuración del servidor." 
    }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Autorización fallida:', {
      received: authHeader,
      expected: `Bearer ${cronSecret}`
    });
    return NextResponse.json({ 
      message: "No autorizado." 
    }, { status: 401 });
  }

  console.log("\n--- [CRON | check-expired-loans]: Verificando préstamos vencidos... ---");
  
  const db = getDb();
  const now = new Date();
  let processedCount = 0;

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    
    if (studentsSnapshot.empty) {
      console.log("[CRON | check-expired-loans]: No se encontraron estudiantes.");
      return NextResponse.json({ 
        message: "No se encontraron estudiantes." 
      });
    }

    const batchPromises = [];

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const loansRef = studentDoc.ref.collection('Prestamos');
      
      // 1. --- BUSCAMOS PRÉSTAMOS ACTIVOS Y VENCIDOS ---
      const expiredLoansQuery = loansRef
        .where('estado', '==', 'activo')
        .where('fechaDevolucion', '<', now);
      
      const loansSnapshot = await expiredLoansQuery.get();
      
      if (loansSnapshot.empty) continue;

      console.log(
        `[CRON | c-exp]: Estudiante ${studentData.nombre || studentDoc.id} tiene ${loansSnapshot.size} préstamos vencidos.`
      );

      const writeBatch = db.batch();

      for (const loanDoc of loansSnapshot.docs) {
        processedCount++;
        const loanData = loanDoc.data();
        
        console.log(
          ` -> Procesando préstamo ${loanDoc.id} (${loanData.nombreMaterial}).`
        );

        // 2. --- ACTUALIZAMOS EL ESTADO DEL PRÉSTAMO ---
        writeBatch.update(loanDoc.ref, {
          estado: 'expirado',
          fechaExpiracion: admin.firestore.Timestamp.now()
        });

        // 3. --- CREAMOS LA NOTIFICACIÓN INTERNA ---
        const notificationRef = studentDoc.ref.collection('Notificaciones').doc();
        writeBatch.set(notificationRef, {
          tipo: 'vencimiento',
          prestamoId: loanDoc.id,
          mensaje: `⚠️ Tu préstamo de ${loanData.nombreMaterial || 'material'} ha vencido.`,
          enviado: true,
          fechaEnvio: admin.firestore.Timestamp.now(),
          canal: 'interno',
          leida: false
        });
      }

      // Agregamos el batch a un array de promesas para ejecutarlo
      batchPromises.push(writeBatch.commit());
    }

    await Promise.all(batchPromises);

    console.log(
      `--- [CRON | check-expired-loans]: Finalizado. ${processedCount} préstamos marcados como expirados. ---\n`
    );

    if (processedCount > 0) {
      return NextResponse.json({ 
        message: `Proceso completado. ${processedCount} préstamos se marcaron como expirados.` 
      });
    }

    return NextResponse.json({ 
      message: "Proceso completado. No se encontraron préstamos vencidos." 
    });

  } catch (error: any) {
    console.error("[CRON | check-expired-loans ERROR]:", error);
    return NextResponse.json({ 
      message: "Error durante la ejecución del proceso CRON.", 
      error: error.message 
    }, { status: 500 });
  }
}