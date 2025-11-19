
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  console.log("\n--- [CRON | generate-forms]: Buscando préstamos expirados para generar formulario... ---");
  const db = getDb();
  let formsSentCount = 0;
  // CORRECTO: Se usará para comparar contra la fecha de expiración
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    if (studentsSnapshot.empty) {
      return NextResponse.json({ message: "No se encontraron estudiantes." });
    }

    const formPromises = [];

    for (const studentDoc of studentsSnapshot.docs) {
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();
      const loansRef = studentDoc.ref.collection('Prestamos');
      const formsRef = studentDoc.ref.collection('Formularios');

      // 1. --- LÓGICA CORREGIDA: BUSCAMOS PRÉSTAMOS EXPIRADOS HACE MÁS DE 24 HORAS ---
      const expiredLoansQuery = loansRef
        .where('estado', '==', 'expirado')
        .where('fechaExpiracion', '<', twentyFourHoursAgo); // <-- ¡EL FIX CRÍTICO ESTÁ AQUÍ!

      const loansSnapshot = await expiredLoansQuery.get();
      if (loansSnapshot.empty) continue;

      console.log(`[CRON | g-forms]: Estudiante ${studentData.nombre || studentId} tiene ${loansSnapshot.size} préstamos listos para formulario.`);

      for (const loanDoc of loansSnapshot.docs) {
        const loanData = loanDoc.data();
        const prestamoId = loanDoc.id;

        const processPromise = async () => {
          // 2. --- VERIFICAMOS QUE NO EXISTA YA UN FORMULARIO PARA ESTE PRÉSTAMO ---
          const existingFormQuery = formsRef.where('prestamoId', '==', prestamoId).limit(1);
          const existingFormSnap = await existingFormQuery.get();

          if (!existingFormSnap.empty) {
            console.log(` -> Formulario para préstamo ${prestamoId} ya existe. Saltando.`);
            return;
          }
          
          console.log(` -> Generando formulario para préstamo ${prestamoId} (${loanData.nombreMaterial}).`);

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
          
          // 3. --- CREACIÓN DE LOS 3 DOCUMENTOS EN BATCH ---
          batch.set(formsRef.doc(formId), formData);
          batch.set(globalFormsRef.doc(formId), { ...formData, uid: studentId, nombreEstudiante: studentData.nombre || '', correoEstudiante: studentData.correo || '' });
          batch.set(notificationsRef.doc(), { tipo: 'formulario', prestamoId: prestamoId, mensaje: `📋 Por favor completa este formulario sobre tu préstamo vencido.`, formUrl: formUrl, enviado: true, fechaEnvio: admin.firestore.Timestamp.now(), canal: 'interno', leida: false });
          
          await batch.commit();
          formsSentCount++;
          console.log(`   -> Formulario ${formId} creado y notificado.`);
        };
        formPromises.push(processPromise());
      }
    }

    await Promise.all(formPromises);

    console.log(`--- [CRON | generate-forms]: Finalizado. ${formsSentCount} formularios generados. ---\n`);
    return NextResponse.json({ message: `Proceso completado. Se generaron ${formsSentCount} formularios de seguimiento.` });

  } catch (error: any) {
    console.error("[CRON | generate-forms ERROR]:", error);
    return NextResponse.json({ message: "Error durante la ejecución del proceso CRON.", error: error.message }, { status: 500 });
  }
}
