import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  console.log('🔍 Debug Auth:', {
    receivedHeader: authHeader ? 'Presente' : 'Ausente',
    expectedSecret: cronSecret ? 'Configurado' : 'NO CONFIGURADO',
    match: authHeader === `Bearer ${cronSecret}`
  });

  if (!cronSecret) {
    console.error('❌ CRON_SECRET no configurado');
    return NextResponse.json({ 
      message: "Error de configuración del servidor." 
    }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Autorización fallida');
    return NextResponse.json({ 
      message: "No autorizado." 
    }, { status: 401 });
  }

  console.log("\n--- [CRON | check-expired-loans]: Verificando préstamos vencidos... ---");
  
  const db = getDb();
  const now = new Date();
  let processedCount = 0;
  let batchesCommitted = 0;
  let errors: string[] = [];

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    
    if (studentsSnapshot.empty) {
      console.log("[CRON | check-expired-loans]: No se encontraron estudiantes.");
      return NextResponse.json({ 
        message: "No se encontraron estudiantes." 
      });
    }

    console.log(`📊 Total de estudiantes: ${studentsSnapshot.size}`);

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const loansRef = studentDoc.ref.collection('Prestamos');
      
      // 1. BUSCAR PRÉSTAMOS ACTIVOS Y VENCIDOS
      const expiredLoansQuery = loansRef
        .where('estado', '==', 'activo')
        .where('fechaDevolucion', '<', now);
      
      const loansSnapshot = await expiredLoansQuery.get();
      
      if (loansSnapshot.empty) continue;

      console.log(
        `[CRON | c-exp]: Estudiante ${studentData.nombre || studentDoc.id} tiene ${loansSnapshot.size} préstamos vencidos.`
      );

      const writeBatch = db.batch();
      let operationsInBatch = 0;

      for (const loanDoc of loansSnapshot.docs) {
        try {
          processedCount++;
          const loanData = loanDoc.data();
          
          console.log(
            ` -> Procesando préstamo ${loanDoc.id} (${loanData.nombreMaterial}).`
          );

          // 2. ACTUALIZAR EL ESTADO DEL PRÉSTAMO
          writeBatch.update(loanDoc.ref, {
            estado: 'expirado',
            fechaExpiracion: admin.firestore.Timestamp.now()
          });
          operationsInBatch++;

          // 3. CREAR LA NOTIFICACIÓN INTERNA
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
          operationsInBatch++;

        } catch (loanError: any) {
          console.error(`❌ Error procesando préstamo ${loanDoc.id}:`, loanError);
          errors.push(`Préstamo ${loanDoc.id}: ${loanError.message}`);
        }
      }

      // 4. COMMIT DEL BATCH
      if (operationsInBatch > 0) {
        console.log(`🔄 Committing batch con ${operationsInBatch} operaciones para ${studentData.nombre || studentDoc.id}...`);
        try {
          await writeBatch.commit();
          batchesCommitted++;
          console.log(`✅ Batch committed exitosamente`);
        } catch (commitError: any) {
          console.error(`❌ Error en commit para ${studentData.nombre || studentDoc.id}:`, commitError);
          errors.push(`Commit ${studentDoc.id}: ${commitError.message}`);
        }
      }
    }

    console.log(
      `\n--- [CRON | check-expired-loans]: Finalizado ---`
    );
    console.log(`📊 Préstamos procesados: ${processedCount}`);
    console.log(`✅ Batches committed: ${batchesCommitted}`);
    if (errors.length > 0) {
      console.error(`⚠️ Errores encontrados: ${errors.length}`);
      console.error(errors);
    }

    return NextResponse.json({ 
      success: true,
      message: `Proceso completado. ${processedCount} préstamos procesados.`,
      processedCount,
      batchesCommitted,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error("[CRON | check-expired-loans ERROR]:", error);
    return NextResponse.json({ 
      success: false,
      message: "Error durante la ejecución del proceso CRON.", 
      error: error.message 
    }, { status: 500 });
  }
}