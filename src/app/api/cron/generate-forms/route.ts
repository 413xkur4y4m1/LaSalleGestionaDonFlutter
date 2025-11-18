import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';
import { ai, overduePrompt, Student, loanTool } from '@/ai/genkit';

export async function GET(request: NextRequest) {
  // 1. --- SEGURIDAD PRIMERO ---
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CRON | generate-forms]: Intento de acceso no autorizado');
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  console.log("\n--- [CRON | generate-forms]: Iniciando búsqueda de adeudos... ---");
  const db = getDb();

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    
    if (studentsSnapshot.empty) {
      console.log('[CRON | generate-forms]: No se encontraron estudiantes en la base de datos');
      return NextResponse.json({ 
        message: "No se encontraron estudiantes.",
        formsSent: 0 
      });
    }

    let formsSentCount = 0;
    const promises: Promise<void>[] = [];

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const studentId = studentDoc.id;

      const adeudosRef = studentDoc.ref.collection('Adeudos');
      const newAdeudosQuery = adeudosRef.where('formSent', '==', false);

      const promise = newAdeudosQuery.get().then(async (adeudosSnapshot) => {
        if (adeudosSnapshot.empty) return;

        console.log(`[CRON | generate-forms]: Estudiante ${studentData.nombre || studentId} tiene ${adeudosSnapshot.size} adeudos pendientes.`);

        for (const adeudoDoc of adeudosSnapshot.docs) {
          const adeudoData = adeudoDoc.data();
          
          try {
            console.log(`  -> Procesando adeudo ${adeudoDoc.id} (${adeudoData.nombreMaterial || 'Material desconocido'}).`);

            const studentInfo: Student = {
              id: studentId,
              name: studentData.nombre || 'Estudiante',
              email: studentData.correo || 'N/A',
            };

            // 2. --- GENERACIÓN DE LA CONVERSACIÓN CON GENKIT ---
            const llmResponse = await overduePrompt({
              student: studentInfo,
              material: adeudoData.nombreMaterial || 'Material sin nombre',
              quantity: adeudoData.cantidad || 1,
            });

            const messageContent = llmResponse.text;

            if (!messageContent || messageContent.trim().length === 0) {
              console.warn(`  -> Advertencia: Respuesta vacía de Genkit para adeudo ${adeudoDoc.id}`);
              continue;
            }

            // 3. --- GUARDAR EL MENSAJE EN EL CHAT DEL ESTUDIANTE ---
            const chatMessageRef = studentDoc.ref.collection('ChatMessages').doc();
            await chatMessageRef.set({
              role: 'model',
              text: messageContent,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              read: false,
              adeudoId: adeudoDoc.id,
              materialName: adeudoData.nombreMaterial || 'Material desconocido',
            });

            // 4. --- MARCAR EL FORMULARIO COMO ENVIADO ---
            await adeudoDoc.ref.update({ 
              formSent: true,
              formSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            formsSentCount++;
            console.log(`  ✓ Formulario enviado y adeudo actualizado correctamente.`);

          } catch (adeudoError: any) {
            console.error(`  ✗ Error procesando adeudo ${adeudoDoc.id}:`, adeudoError.message);
            // Continuar con el siguiente adeudo sin detener el proceso
          }
        }
      }).catch((studentError: any) => {
        console.error(`[CRON | generate-forms]: Error procesando estudiante ${studentId}:`, studentError.message);
        // Continuar con el siguiente estudiante
      });

      promises.push(promise);
    }

    await Promise.all(promises);

    console.log(`--- [CRON | generate-forms]: ✓ Finalizado. ${formsSentCount} formularios enviados exitosamente. ---\n`);
    
    return NextResponse.json({ 
      message: `Proceso completado exitosamente.`,
      formsSent: formsSentCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[CRON | generate-forms ERROR CRÍTICO]:", error);
    return NextResponse.json({ 
      message: "Error crítico durante la ejecución del proceso CRON.", 
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}