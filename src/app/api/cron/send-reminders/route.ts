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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  console.log("\n========================================");
  console.log("🤖 PROCESS OVERDUE LOANS - INICIO");
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log("========================================\n");
  
  const db = getDb();
  const now = admin.firestore.Timestamp.now();
  const nowMillis = now.toMillis();
  
  // 24 horas atrás
  const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(nowMillis - (24 * 60 * 60 * 1000));
  
  let stats = {
    adeudosCreados: 0,
    emailsEnviados: 0,
    prestamosAnalizados: 0,
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
      const loansRef = studentDoc.ref.collection('Prestamos');
      
      console.log(`👤 Procesando: ${studentData.nombre || studentDoc.id} (${studentEmail || 'sin email'})`);

      // ============================================
      // CONVERTIR PRÉSTAMOS EXPIRADOS A ADEUDOS
      // (Solo los que llevan más de 24h vencidos)
      // ============================================
      try {
        const expiredLoansSnapshot = await loansRef
          .where('estado', '==', 'expirado')
          .get();
        
        stats.prestamosAnalizados += expiredLoansSnapshot.size;
        
        // Filtrar manualmente por fecha (más de 24h vencidos)
        const expiredLoans = expiredLoansSnapshot.docs.filter(doc => {
          const loanData = doc.data();
          if (!loanData.fechaDevolucion) return false;
          return loanData.fechaDevolucion.toMillis() < twentyFourHoursAgo.toMillis();
        });
        
        if (expiredLoans.length > 0) {
          console.log(`   ⚠️  ${expiredLoans.length} préstamos expirados hace más de 24h`);
          
          for (const loanDoc of expiredLoans) {
            try {
              const loanData = loanDoc.data();
              
              // Validar que tenga los campos necesarios
              if (!loanData.nombreMaterial || 
                  loanData.cantidad === undefined || loanData.cantidad === null ||
                  loanData.precio_unitario === undefined || loanData.precio_unitario === null) {
                console.log(`   ⏭️  Préstamo ${loanDoc.id} sin datos completos, saltando...`);
                continue;
              }
              
              // Verificar que no exista ya un adeudo para este préstamo
              const existingAdeudo = await studentDoc.ref
                .collection('Adeudos')
                .where('prestamoOriginal', '==', loanDoc.id)
                .limit(1)
                .get();
              
              if (!existingAdeudo.empty) {
                console.log(`   ⏭️  Adeudo ya existe para préstamo ${loanDoc.id}`);
                continue;
              }
              
              // Generar código de adeudo
              const adeudoCodigo = `ADEU-${loanData.grupo || 'XXX'}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
              
              // Calcular precio ajustado
              const precioAjustado = loanData.precio_total || (loanData.cantidad * loanData.precio_unitario) || 0;
              
              // Crear adeudo
              const adeudoData = {
                codigo: adeudoCodigo,
                nombreMaterial: loanData.nombreMaterial,
                cantidad: loanData.cantidad,
                precio_unitario: loanData.precio_unitario,
                precio_ajustado: precioAjustado,
                moneda: 'MXN',
                estado: 'pendiente',
                tipo: 'vencimiento',
                fechaVencimiento: loanData.fechaDevolucion,
                grupo: loanData.grupo || '',
                prestamoOriginal: loanDoc.id,
                fechaCreacion: admin.firestore.Timestamp.now()
              };
              
              await studentDoc.ref.collection('Adeudos').add(adeudoData);
              
              // Eliminar el préstamo expirado
              await loanDoc.ref.delete();
              
              // Crear notificación
              await studentDoc.ref.collection('Notificaciones').add({
                tipo: 'adeudo',
                prestamoId: loanDoc.id,
                mensaje: `💰 Se ha generado un adeudo por ${loanData.nombreMaterial}. Por favor realiza el pago.`,
                enviado: true,
                fechaEnvio: admin.firestore.Timestamp.now(),
                canal: 'interno',
                leida: false
              });
              
              stats.adeudosCreados++;
              console.log(`   ✅ Adeudo creado: ${adeudoCodigo}`);
              
              // Enviar email de notificación de adeudo
              if (studentEmail && studentEmail.includes('@')) {
                try {
                  await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: studentEmail,
                    subject: `⚠️ Adeudo Generado - ${loanData.nombreMaterial}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #dc2626; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                          <h2 style="color: white; margin: 0;">💰 Nuevo Adeudo Generado</h2>
                        </div>
                        
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                          <p>Hola <strong>${studentData.nombre}</strong>,</p>
                          
                          <p>Se ha generado un adeudo porque no devolviste el material a tiempo:</p>
                          
                          <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                            <p style="margin: 5px 0;"><strong>📦 Material:</strong> ${loanData.nombreMaterial}</p>
                            <p style="margin: 5px 0;"><strong>🔢 Cantidad:</strong> ${loanData.cantidad}</p>
                            <p style="margin: 5px 0;"><strong>💵 Monto a pagar:</strong> ${precioAjustado > 0 ? `$${precioAjustado.toFixed(2)} MXN` : 'Contacta al laboratorio'}</p>
                            <p style="margin: 5px 0;"><strong>🔖 Código de adeudo:</strong> ${adeudoCodigo}</p>
                            <p style="margin: 5px 0;"><strong>⏰ Fecha de vencimiento original:</strong> ${loanData.fechaDevolucion.toDate().toLocaleString('es-MX')}</p>
                          </div>
                          
                          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                            <p style="margin: 0; font-size: 14px;">
                              <strong>💡 Opciones:</strong><br/>
                              • Devuelve el material físicamente en el laboratorio<br/>
                              • Realiza el pago para liquidar el adeudo<br/>
                              • Recibirás un formulario por correo para elegir tu opción
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
                  console.log(`   📧 Email de adeudo enviado a: ${studentEmail}`);
                  
                } catch (emailError: any) {
                  console.error(`   ❌ Error enviando email de adeudo:`, emailError.message);
                  stats.errors.push(`Email adeudo ${studentEmail}: ${emailError.message}`);
                }
              }
              
            } catch (error: any) {
              console.error(`   ❌ Error creando adeudo:`, error);
              stats.errors.push(`Adeudo ${loanDoc.id}: ${error.message}`);
            }
          }
        } else {
          console.log(`   ℹ️  No hay préstamos vencidos hace más de 24h`);
        }
      } catch (error: any) {
        console.error(`   ❌ Error consultando préstamos expirados:`, error.message);
        stats.errors.push(`Consulta expirados ${studentDoc.id}: ${error.message}`);
      }
      
      console.log(''); // Línea en blanco
    }

    console.log("========================================");
    console.log("✅ PROCESS OVERDUE - FINALIZADO");
    console.log("========================================");
    console.log(`👥 Estudiantes procesados: ${studentsSnapshot.size}`);
    console.log(`📋 Préstamos analizados: ${stats.prestamosAnalizados}`);
    console.log(`💰 Adeudos creados: ${stats.adeudosCreados}`);
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
    console.error("\n❌❌❌ [CRON | process-overdue ERROR CRÍTICO] ❌❌❌");
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