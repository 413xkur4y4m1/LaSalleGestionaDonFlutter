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

  console.log("\n--- [CRON | send-reminders]: Buscando préstamos por vencer... ---");
  
  const db = getDb();
  let remindersSentCount = 0;
  let loansFoundCount = 0;
  let duplicatesSkipped = 0;
  let errors: string[] = [];
  
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Próximas 24 horas

  console.log(`⏰ Ventana de tiempo: ${now.toISOString()} hasta ${reminderWindow.toISOString()}`);

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    
    if (studentsSnapshot.empty) {
      console.log("❌ No se encontraron estudiantes.");
      return NextResponse.json({ 
        message: "No se encontraron estudiantes." 
      });
    }

    console.log(`📊 Total de estudiantes: ${studentsSnapshot.size}`);

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const loansRef = studentDoc.ref.collection('Prestamos');
      const notificationsRef = studentDoc.ref.collection('Notificaciones');
      
      // 1. BUSCAR PRÉSTAMOS ACTIVOS QUE VENCEN PRONTO
      const reminderQuery = loansRef
        .where('estado', '==', 'activo')
        .where('fechaDevolucion', '>=', now)
        .where('fechaDevolucion', '<=', reminderWindow);

      const loansSnapshot = await reminderQuery.get();
      
      if (loansSnapshot.empty) continue;

      loansFoundCount += loansSnapshot.size;
      console.log(
        `[CRON | s-rem]: Estudiante ${studentData.nombre || studentDoc.id} tiene ${loansSnapshot.size} préstamos por vencer.`
      );

      for (const loanDoc of loansSnapshot.docs) {
        try {
          const loanData = loanDoc.data();
          const prestamoId = loanDoc.id;
          
          // Mostrar fecha de vencimiento para debug
          const fechaVencimiento = loanData.fechaDevolucion?.toDate();
          console.log(
            ` -> Préstamo ${prestamoId} (${loanData.nombreMaterial}) vence: ${fechaVencimiento?.toISOString() || 'N/A'}`
          );

          // 2. VERIFICAR QUE NO EXISTA UN RECORDATORIO PREVIO
          const existingNotifSnap = await notificationsRef
            .where('tipo', '==', 'recordatorio')
            .where('prestamoId', '==', prestamoId)
            .limit(1)
            .get();

          if (!existingNotifSnap.empty) {
            duplicatesSkipped++;
            console.log(
              ` -> ⏭️  Recordatorio ya enviado anteriormente. Saltando.`
            );
            continue;
          }

          // 3. CREAR LA NUEVA NOTIFICACIÓN
          console.log(
            ` -> 📤 Enviando recordatorio...`
          );
          
          await notificationsRef.add({
            tipo: 'recordatorio',
            prestamoId: prestamoId,
            mensaje: `⏰ RECORDATORIO: Tu préstamo de ${loanData.nombreMaterial || 'material'} vence pronto. Por favor devuélvelo a tiempo.`,
            enviado: true,
            fechaEnvio: admin.firestore.Timestamp.now(),
            canal: 'interno',
            leida: false
          });
          
          remindersSentCount++;
          console.log(` -> ✅ Recordatorio enviado exitosamente`);

        } catch (loanError: any) {
          console.error(`❌ Error procesando préstamo ${loanDoc.id}:`, loanError);
          errors.push(`Préstamo ${loanDoc.id}: ${loanError.message}`);
        }
      }
    }

    console.log(
      `\n--- [CRON | send-reminders]: Finalizado ---`
    );
    console.log(`📊 Préstamos encontrados: ${loansFoundCount}`);
    console.log(`✅ Recordatorios enviados: ${remindersSentCount}`);
    console.log(`⏭️  Duplicados saltados: ${duplicatesSkipped}`);
    if (errors.length > 0) {
      console.error(`⚠️ Errores encontrados: ${errors.length}`);
      console.error(errors);
    }

    return NextResponse.json({ 
      success: true,
      message: `Proceso completado. Se enviaron ${remindersSentCount} recordatorios.`,
      loansFound: loansFoundCount,
      remindersSent: remindersSentCount,
      duplicatesSkipped,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error("[CRON | send-reminders ERROR]:", error);
    return NextResponse.json({ 
      success: false,
      message: "Error durante la ejecución del proceso CRON.", 
      error: error.message 
    }, { status: 500 });
  }
}