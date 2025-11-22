import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';

// Configurar transporter de Outlook
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: { 
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Función para generar QR del formulario
function generateQRCodeDataURL(text: string, size: number = 250): string {
  const encodedText = encodeURIComponent(text);
  return `https://quickchart.io/qr?text=${encodedText}&size=${size}&margin=1`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  console.log("\n========================================");
  console.log("📋 GENERATE FORMS - INICIO");
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log("========================================\n");
  
  const db = getDb();
  
  let stats = {
    formulariosCreados: 0,
    emailsEnviados: 0,
    adeudosAnalizados: 0,
    errors: [] as string[]
  };

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    
    if (studentsSnapshot.empty) {
      console.log("⚠️ No se encontraron estudiantes.");
      return NextResponse.json({ message: "No se encontraron estudiantes." });
    }

    console.log(`📊 Total de estudiantes: ${studentsSnapshot.size}\n`);

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const studentEmail = studentData.correo;
      const studentUid = studentDoc.id;
      const adeudosRef = studentDoc.ref.collection('Adeudos');
      const formulariosRef = studentDoc.ref.collection('Formularios');
      
      console.log(`👤 Procesando: ${studentData.nombre || studentUid} (${studentEmail || 'sin email'})`);

      try {
        // Buscar adeudos pendientes por vencimiento
        const adeudosSnapshot = await adeudosRef
          .where('estado', '==', 'pendiente')
          .where('tipo', '==', 'vencimiento')
          .get();
        
        stats.adeudosAnalizados += adeudosSnapshot.size;
        
        if (adeudosSnapshot.empty) {
          console.log(`   ℹ️  No hay adeudos pendientes por vencimiento`);
          continue;
        }
        
        console.log(`   📋 ${adeudosSnapshot.size} adeudos pendientes por vencimiento encontrados`);
        
        for (const adeudoDoc of adeudosSnapshot.docs) {
          try {
            const adeudoData = adeudoDoc.data();
            const adeudoId = adeudoDoc.id;
            const prestamoOriginal = adeudoData.prestamoOriginal;
            
            // Verificar si ya existe un formulario para este préstamo
            const existingFormQuery = await formulariosRef
              .where('prestamoId', '==', prestamoOriginal)
              .where('adeudoId', '==', adeudoId)
              .limit(1)
              .get();
            
            if (!existingFormQuery.empty) {
              console.log(`   ⏭️  Formulario ya existe para adeudo ${adeudoData.codigo}`);
              continue;
            }
            
            // Generar ID único para el formulario
            const formId = `FORM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.vercel.app';
            const formUrl = `${baseUrl}/formularios/${formId}`;
            
            // Preparar datos del formulario
            const pregunta = `No has devuelto "${adeudoData.nombreMaterial}". ¿Qué sucedió?`;
            const opciones = [
              'Lo tengo pero no lo he devuelto',
              'Lo rompí',
              'Lo perdí'
            ];
            
            const formData = {
              formId: formId,
              prestamoId: prestamoOriginal,
              adeudoId: adeudoId,
              tipo: 'seguimiento',
              pregunta: pregunta,
              opciones: opciones,
              respuesta: '',
              estado: 'pendiente',
              fechaCreacion: admin.firestore.Timestamp.now(),
              urlFormulario: formUrl
            };
            
            // Datos adicionales para la colección global
            const formDataGlobal = {
              ...formData,
              uid: studentUid,
              nombreEstudiante: studentData.nombre || '',
              correoEstudiante: studentEmail || '',
              nombreMaterial: adeudoData.nombreMaterial,
              cantidad: adeudoData.cantidad,
              codigoAdeudo: adeudoData.codigo,
              grupo: adeudoData.grupo || '',
              precio_ajustado: adeudoData.precio_ajustado || 0 // AGREGADO: necesario para pagos
            };
            
            // Crear formulario usando batch (ambas ubicaciones + notificación)
            const batch = db.batch();
            
            // 1. Crear en subcolección del estudiante
            const studentFormRef = formulariosRef.doc(formId);
            batch.set(studentFormRef, formData);
            
            // 2. Crear en colección global
            const globalFormRef = db.collection('FormulariosGlobal').doc(formId);
            batch.set(globalFormRef, formDataGlobal);
            
            // 3. Crear notificación interna
            const notificationRef = studentDoc.ref.collection('Notificaciones').doc();
            batch.set(notificationRef, {
              tipo: 'formulario',
              prestamoId: prestamoOriginal,
              adeudoId: adeudoId,
              mensaje: `📋 Por favor completa este formulario sobre tu adeudo de ${adeudoData.nombreMaterial}.`,
              formUrl: formUrl,
              enviado: true,
              fechaEnvio: admin.firestore.Timestamp.now(),
              canal: 'interno',
              leida: false
            });
            
            await batch.commit();
            
            stats.formulariosCreados++;
            console.log(`   ✅ Formulario creado: ${formId} para "${adeudoData.nombreMaterial}"`);
            
            // Enviar email con el formulario
            if (studentEmail && studentEmail.includes('@')) {
              try {
                const qrImageUrl = generateQRCodeDataURL(formUrl, 300);
                
                await transporter.sendMail({
                  from: process.env.EMAIL_USER,
                  to: studentEmail,
                  subject: `📋 Formulario Importante - Adeudo de ${adeudoData.nombreMaterial}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                      <div style="background-color: #7c3aed; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="color: white; margin: 0;">📋 Formulario de Seguimiento</h2>
                      </div>
                      
                      <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                        <p>Hola <strong>${studentData.nombre}</strong>,</p>
                        
                        <p>Necesitamos que completes un breve formulario sobre tu adeudo:</p>
                        
                        <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                          <p style="margin: 5px 0;"><strong>📦 Material:</strong> ${adeudoData.nombreMaterial}</p>
                          <p style="margin: 5px 0;"><strong>🔢 Cantidad:</strong> ${adeudoData.cantidad}</p>
                          <p style="margin: 5px 0;"><strong>🔖 Código de adeudo:</strong> ${adeudoData.codigo}</p>
                          <p style="margin: 5px 0;"><strong>💰 Estado:</strong> Pendiente</p>
                        </div>
                        
                        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                          <p style="margin: 0; font-size: 14px;">
                            <strong>❓ Pregunta del formulario:</strong><br/>
                            "${pregunta}"
                          </p>
                        </div>
                        
                        <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 3px solid #7c3aed;">
                          <p style="margin-bottom: 15px; font-size: 16px;"><strong>📱 Escanea este código QR para responder:</strong></p>
                          
                          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                            <img src="${qrImageUrl}" alt="Código QR del Formulario" style="max-width: 300px; width: 100%; height: auto; display: block;" />
                          </div>
                          
                          <p style="font-size: 14px; color: #374151; margin: 15px 0; line-height: 1.6;">
                            <strong>O haz clic en el botón:</strong>
                          </p>
                          
                          <a href="${formUrl}" style="background-color: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 15px 0; font-size: 16px;">
                            📝 Completar Formulario
                          </a>
                          
                          <p style="font-size: 11px; color: #6b7280; margin-top: 15px; padding: 10px; background-color: #f9fafb; border-radius: 4px;">
                            <strong>Link directo:</strong><br/>
                            <span style="font-family: monospace; word-break: break-all;">
                              ${formUrl}
                            </span>
                          </p>
                        </div>
                        
                        <div style="background-color: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
                          <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                            <strong>ℹ️ Opciones de respuesta:</strong><br/>
                            ${opciones.map((opcion, idx) => `${idx + 1}. ${opcion}`).join('<br/>')}
                          </p>
                        </div>
                        
                        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                          <p style="margin: 0; font-size: 14px;">
                            <strong>💡 Importante:</strong> Tu respuesta nos ayudará a resolver tu situación de la mejor manera posible. Por favor completa el formulario lo antes posible.
                          </p>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                          Este es un correo automático del Sistema de Préstamos de Laboratorio.<br/>
                          Por favor no respondas a este mensaje.
                        </p>
                      </div>
                    </div>
                  `,
                });
                
                stats.emailsEnviados++;
                console.log(`   📧 Email enviado a: ${studentEmail}`);
                
              } catch (emailError: any) {
                console.error(`   ❌ Error enviando email:`, emailError.message);
                stats.errors.push(`Email formulario ${studentEmail}: ${emailError.message}`);
              }
            } else {
              console.log(`   ⚠️  Estudiante sin email válido`);
            }
            
          } catch (error: any) {
            console.error(`   ❌ Error procesando adeudo ${adeudoDoc.id}:`, error.message);
            stats.errors.push(`Adeudo ${adeudoDoc.id}: ${error.message}`);
          }
        }
        
      } catch (error: any) {
        console.error(`   ❌ Error consultando adeudos del estudiante:`, error.message);
        stats.errors.push(`Consulta adeudos ${studentUid}: ${error.message}`);
      }
      
      console.log(''); // Línea en blanco
    }

    console.log("========================================");
    console.log("✅ GENERATE FORMS - FINALIZADO");
    console.log("========================================");
    console.log(`👥 Estudiantes procesados: ${studentsSnapshot.size}`);
    console.log(`📋 Adeudos analizados: ${stats.adeudosAnalizados}`);
    console.log(`📝 Formularios creados: ${stats.formulariosCreados}`);
    console.log(`📧 Emails enviados: ${stats.emailsEnviados}`);
    if (stats.errors.length > 0) {
      console.error(`⚠️ Errores encontrados: ${stats.errors.length}`);
      stats.errors.forEach((err, idx) => {
        console.error(`   ${idx + 1}. ${err}`);
      });
    }
    console.log("========================================\n");

    return NextResponse.json({ 
      success: true,
      message: "Proceso completado exitosamente",
      timestamp: new Date().toISOString(),
      ...stats
    });

  } catch (error: any) {
    console.error("\n❌❌❌ [CRON | generate-forms ERROR CRÍTICO] ❌❌❌");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("========================================\n");
    
    return NextResponse.json({ 
      success: false,
      message: "Error durante la ejecución del proceso CRON.", 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}