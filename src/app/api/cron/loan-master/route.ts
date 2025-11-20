import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import { handleOverdueLoans } from '@/lib/firestore-automation';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * MEGA CRON JOB 3 EN 1: Ejecuta todas las tareas relacionadas con préstamos
 * 
 * ✅ INCLUYE:
 * 1. check-expired-loans: Marca préstamos como expirados
 * 2. send-reminders: Envía recordatorios de vencimiento (próximas 24h)
 * 3. generate-forms: Genera formularios de seguimiento (cada 6 horas)
 * 4. handle-overdue-loans: Procesa préstamos vencidos con lógica adicional
 * 
 * EJECUTA CADA HORA, pero formularios solo cada 6 horas
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('❌ CRON_SECRET no configurado');
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Autorización fallida');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("\n========================================");
  console.log("🤖 LOAN MASTER CRON - INICIO");
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log("========================================\n");

  const db = getDb();
  const results = {
    expiredLoans: 0,
    remindersSent: 0,
    formsGenerated: 0,
    overdueProcessed: 0,
    errors: [] as string[]
  };

  try {
    // ============================================
    // PASO 1: MARCAR PRÉSTAMOS EXPIRADOS
    // ============================================
    console.log("📌 [1/4] Marcando préstamos expirados...");
    try {
      const expired = await markExpiredLoans(db);
      results.expiredLoans = expired;
      console.log(`✅ ${expired} préstamos marcados como expirados\n`);
    } catch (error: any) {
      console.error("❌ Error en markExpiredLoans:", error);
      results.errors.push(`markExpiredLoans: ${error.message}`);
    }

    // ============================================
    // PASO 2: ENVIAR RECORDATORIOS
    // ============================================
    console.log("🔔 [2/4] Enviando recordatorios...");
    try {
      const reminders = await sendReminders(db);
      results.remindersSent = reminders;
      console.log(`✅ ${reminders} recordatorios enviados\n`);
    } catch (error: any) {
      console.error("❌ Error en sendReminders:", error);
      results.errors.push(`sendReminders: ${error.message}`);
    }

    // ============================================
    // PASO 3: GENERAR FORMULARIOS (solo cada 6 horas)
    // ============================================
    const currentHour = new Date().getHours();
    const shouldGenerateForms = currentHour % 6 === 0;
    
    if (shouldGenerateForms) {
      console.log("📋 [3/4] Generando formularios de seguimiento...");
      try {
        const forms = await generateForms(db);
        results.formsGenerated = forms;
        console.log(`✅ ${forms} formularios generados\n`);
      } catch (error: any) {
        console.error("❌ Error en generateForms:", error);
        results.errors.push(`generateForms: ${error.message}`);
      }
    } else {
      console.log(`⏭️  [3/4] Saltando generación de formularios (hora actual: ${currentHour})\n`);
    }

    // ============================================
    // PASO 4: PROCESAR PRÉSTAMOS VENCIDOS
    // ============================================
    console.log("🔧 [4/4] Procesando préstamos vencidos...");
    try {
      const overdueResult = await handleOverdueLoans();
      results.overdueProcessed = overdueResult.processedLoans || 0;
      console.log(`✅ ${results.overdueProcessed} préstamos vencidos procesados\n`);
    } catch (error: any) {
      console.error("❌ Error en handleOverdueLoans:", error);
      results.errors.push(`handleOverdueLoans: ${error.message}`);
    }

    console.log("========================================");
    console.log("✅ LOAN MASTER CRON - FINALIZADO");
    console.log("========================================");
    console.log(JSON.stringify(results, null, 2));
    console.log("\n");

    return NextResponse.json({
      success: true,
      message: "Loan Master Cron ejecutado exitosamente",
      timestamp: new Date().toISOString(),
      ...results
    });

  } catch (error: any) {
    console.error("💥 ERROR FATAL EN LOAN MASTER CRON:", error);
    return NextResponse.json({
      success: false,
      error: "Fatal error in cron execution",
      message: error.message,
      results
    }, { status: 500 });
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function markExpiredLoans(db: admin.firestore.Firestore): Promise<number> {
  const now = new Date();
  let processedCount = 0;

  const studentsSnapshot = await db.collection('Estudiantes').get();
  if (studentsSnapshot.empty) return 0;

  const batchPromises = [];

  for (const studentDoc of studentsSnapshot.docs) {
    const loansRef = studentDoc.ref.collection('Prestamos');
    const expiredLoansQuery = loansRef
      .where('estado', '==', 'activo')
      .where('fechaDevolucion', '<', now);
    
    const loansSnapshot = await expiredLoansQuery.get();
    if (loansSnapshot.empty) continue;

    const writeBatch = db.batch();

    for (const loanDoc of loansSnapshot.docs) {
      processedCount++;
      const loanData = loanDoc.data();

      writeBatch.update(loanDoc.ref, {
        estado: 'expirado',
        fechaExpiracion: admin.firestore.Timestamp.now()
      });

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

    batchPromises.push(writeBatch.commit());
  }

  await Promise.all(batchPromises);
  return processedCount;
}

async function sendReminders(db: admin.firestore.Firestore): Promise<number> {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  let remindersSentCount = 0;

  const studentsSnapshot = await db.collection('Estudiantes').get();
  if (studentsSnapshot.empty) return 0;

  const reminderPromises = [];

  for (const studentDoc of studentsSnapshot.docs) {
    const loansRef = studentDoc.ref.collection('Prestamos');
    const notificationsRef = studentDoc.ref.collection('Notificaciones');

    const reminderQuery = loansRef
      .where('estado', '==', 'activo')
      .where('fechaDevolucion', '>=', now)
      .where('fechaDevolucion', '<=', reminderWindow);

    const loansSnapshot = await reminderQuery.get();
    if (loansSnapshot.empty) continue;

    for (const loanDoc of loansSnapshot.docs) {
      const loanData = loanDoc.data();
      const prestamoId = loanDoc.id;

      const checkPromise = notificationsRef
        .where('tipo', '==', 'recordatorio')
        .where('prestamoId', '==', prestamoId)
        .limit(1)
        .get()
        .then(existingNotifSnap => {
          if (!existingNotifSnap.empty) return;

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
  return remindersSentCount;
}

async function generateForms(db: admin.firestore.Firestore): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let formsSentCount = 0;

  const studentsSnapshot = await db.collection('Estudiantes').get();
  if (studentsSnapshot.empty) return 0;

  const formPromises = [];

  for (const studentDoc of studentsSnapshot.docs) {
    const studentId = studentDoc.id;
    const studentData = studentDoc.data();
    const loansRef = studentDoc.ref.collection('Prestamos');
    const formsRef = studentDoc.ref.collection('Formularios');

    const expiredLoansQuery = loansRef
      .where('estado', '==', 'expirado')
      .where('fechaExpiracion', '<', twentyFourHoursAgo);

    const loansSnapshot = await expiredLoansQuery.get();
    if (loansSnapshot.empty) continue;

    for (const loanDoc of loansSnapshot.docs) {
      const loanData = loanDoc.data();
      const prestamoId = loanDoc.id;

      const processPromise = async () => {
        const existingFormQuery = formsRef.where('prestamoId', '==', prestamoId).limit(1);
        const existingFormSnap = await existingFormQuery.get();
        if (!existingFormSnap.empty) return;

        const formId = `FORM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const formUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/formularios/${formId}`;
        const pregunta = `No has devuelto ${loanData.nombreMaterial || 'el material'}. ¿Qué sucedió?`;

        const formData = {
          formId,
          prestamoId,
          tipo: 'seguimiento',
          pregunta,
          opciones: ['Lo tengo pero no lo he devuelto', 'Lo rompí', 'Lo perdí'],
          respuesta: '',
          estado: 'pendiente',
          fechaCreacion: admin.firestore.Timestamp.now(),
          urlFormulario: formUrl
        };

        const batch = db.batch();
        const notificationsRef = studentDoc.ref.collection('Notificaciones');
        const globalFormsRef = db.collection('FormulariosGlobal');

        batch.set(formsRef.doc(formId), formData);
        batch.set(globalFormsRef.doc(formId), {
          ...formData,
          uid: studentId,
          nombreEstudiante: studentData.nombre || '',
          correoEstudiante: studentData.correo || ''
        });
        batch.set(notificationsRef.doc(), {
          tipo: 'formulario',
          prestamoId: prestamoId,
          mensaje: `📋 Por favor completa este formulario sobre tu préstamo vencido.`,
          formUrl: formUrl,
          enviado: true,
          fechaEnvio: admin.firestore.Timestamp.now(),
          canal: 'interno',
          leida: false
        });

        await batch.commit();
        formsSentCount++;
      };

      formPromises.push(processPromise());
    }
  }

  await Promise.all(formPromises);
  return formsSentCount;
}