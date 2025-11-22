import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

// Función para generar código QR en SVG
function generateQRCodeSVG(text: string, size: number = 200): string {
  // Usamos una API pública para generar QR en SVG (sin dependencias adicionales)
  const encodedText = encodeURIComponent(text);
  // Alternativa: usar quickchart.io que genera QR en formato SVG
  return `https://quickchart.io/qr?text=${encodedText}&size=${size}&format=svg&margin=1`;
}

// Función alternativa: generar QR como Data URL para embedding directo
function generateQRCodeDataURL(text: string, size: number = 200): string {
  const encodedText = encodeURIComponent(text);
  return `https://quickchart.io/qr?text=${encodedText}&size=${size}&margin=1`;
}

// Configurar transporter de Outlook - CORREGIDO
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com', // Cambiado de smtp.office365.com
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: { 
    ciphers: 'SSLv3',
    rejectUnauthorized: false // Añadido para evitar problemas de certificados
  }
});

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  console.log("\n========================================");
  console.log("🤖 SEND REMINDERS & PROCESS OVERDUE - INICIO");
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log("========================================\n");
  
  const db = getDb();
  const now = admin.firestore.Timestamp.now();
  const nowMillis = now.toMillis();
  
  // Ventanas de tiempo
  const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(nowMillis - (24 * 60 * 60 * 1000));
  const oneDayAhead = admin.firestore.Timestamp.fromMillis(nowMillis + (24 * 60 * 60 * 1000));
  
  let stats = {
    adeudosCreados: 0,
    qrGenerados: 0,
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
      // PARTE 1: CONVERTIR EXPIRADOS A ADEUDOS
      // ============================================
      // CORREGIDO: Buscar por 'fechaDevolucion' no 'fechaExpiracion'
      try {
        const expiredLoansSnapshot = await loansRef
          .where('estado', '==', 'expirado')
          .get();
        
        // Filtrar manualmente por fecha (evita problemas de índices)
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
              
              // Validar que tenga los campos necesarios (verificar que existen, no su valor)
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
              
              // Crear adeudo
              const precioAjustado = loanData.precio_total || (loanData.cantidad * loanData.precio_unitario) || 0;
              
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
              
              // Enviar email de notificación de adeudo
              if (studentEmail && studentEmail.includes('@')) {
                try {
                  await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: studentEmail,
                    subject: `⚠️ Adeudo Generado - ${loanData.nombreMaterial}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                        <h2 style="color: #dc2626;">💰 Nuevo Adeudo Generado</h2>
                        <p>Hola <strong>${studentData.nombre}</strong>,</p>
                        
                        <p>Se ha generado un adeudo porque no devolviste el material a tiempo:</p>
                        
                        <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                          <p><strong>📦 Material:</strong> ${loanData.nombreMaterial}</p>
                          <p><strong>🔢 Cantidad:</strong> ${loanData.cantidad}</p>
                          <p><strong>💵 Monto a pagar:</strong> ${precioAjustado > 0 ? `${precioAjustado.toFixed(2)} MXN` : 'Contacta al laboratorio'}</p>
                          <p><strong>🔖 Código de adeudo:</strong> ${adeudoCodigo}</p>
                          <p><strong>⏰ Fecha de vencimiento original:</strong> ${loanData.fechaDevolucion.toDate().toLocaleString('es-MX')}</p>
                        </div>
                        
                        <p>Por favor, acércate al laboratorio para realizar el pago o devolver el material.</p>
                        
                        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                          Este es un correo automático. Por favor no respondas a este mensaje.
                        </p>
                      </div>
                    `,
                  });
                  
                  console.log(`   📧 Email de adeudo enviado a: ${studentEmail}`);
                  
                } catch (emailError: any) {
                  console.error(`   ❌ Error enviando email de adeudo:`, emailError.message);
                  stats.errors.push(`Email adeudo ${studentEmail}: ${emailError.message}`);
                }
              }
              
              stats.adeudosCreados++;
              console.log(`   ✅ Adeudo creado: ${adeudoCodigo}`);
              
            } catch (error: any) {
              console.error(`   ❌ Error creando adeudo:`, error);
              stats.errors.push(`Adeudo ${loanDoc.id}: ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        console.error(`   ❌ Error consultando préstamos expirados:`, error.message);
        stats.errors.push(`Consulta expirados ${studentDoc.id}: ${error.message}`);
      }

      // ============================================
      // PARTE 2: GENERAR QR PARA PRÓXIMOS A VENCER
      // ============================================
      try {
        const activeLoansSnapshot = await loansRef
          .where('estado', '==', 'activo')
          .get();
        
        // Filtrar manualmente por rango de fechas
        const upcomingLoans = activeLoansSnapshot.docs.filter(doc => {
          const loanData = doc.data();
          if (!loanData.fechaDevolucion) return false;
          const devolucionMillis = loanData.fechaDevolucion.toMillis();
          return devolucionMillis >= nowMillis && devolucionMillis <= oneDayAhead.toMillis();
        });
        
        stats.prestamosAnalizados += activeLoansSnapshot.size;
        
        if (upcomingLoans.length > 0) {
          console.log(`   ⏰ ${upcomingLoans.length} préstamos vencen en las próximas 24h`);
          
          for (const loanDoc of upcomingLoans) {
            try {
              const loanData = loanDoc.data();
              
              // Verificar si ya tiene QR generado
              if (loanData.qrToken) {
                console.log(`   ⏭️  QR ya generado para préstamo ${loanDoc.id}`);
                continue;
              }
              
              // Generar token único para QR
              const qrToken = randomBytes(32).toString('hex');
              const qrValidUntil = admin.firestore.Timestamp.fromMillis(
                loanData.fechaDevolucion.toMillis() + (2 * 60 * 60 * 1000) // +2h después de vencimiento
              );
              
              // URL del QR
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.vercel.app';
              const qrUrl = `${baseUrl}/devolucion/${qrToken}`;
              
              // Actualizar préstamo con info del QR
              await loanDoc.ref.update({
                qrToken: qrToken,
                qrValidoHasta: qrValidUntil,
                qrGenerado: admin.firestore.Timestamp.now()
              });
              
              // Crear notificación con QR
              await studentDoc.ref.collection('Notificaciones').add({
                tipo: 'recordatorio',
                prestamoId: loanDoc.id,
                mensaje: `⏰ Tu préstamo de ${loanData.nombreMaterial} vence pronto. Usa el QR para devolverlo.`,
                qrUrl: qrUrl,
                enviado: true,
                fechaEnvio: admin.firestore.Timestamp.now(),
                canal: 'interno',
                leida: false
              });
              
              stats.qrGenerados++;
              console.log(`   ✅ QR generado para: ${loanData.nombreMaterial}`);
              
              // Enviar email con QR
              if (studentEmail && studentEmail.includes('@')) {
                try {
                  const fechaDevolucionFormateada = loanData.fechaDevolucion.toDate().toLocaleString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: studentEmail,
                    subject: `⏰ Recordatorio: Tu préstamo vence pronto - ${loanData.nombreMaterial}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #dc2626; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                          <h2 style="color: white; margin: 0;">⏰ Recordatorio de Devolución</h2>
                        </div>
                        
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                          <p>Hola <strong>${studentData.nombre}</strong>,</p>
                          
                          <p>Tu préstamo de <strong>${loanData.nombreMaterial}</strong> vence pronto. ¡No olvides devolverlo a tiempo!</p>
                          
                          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                            <p style="margin: 5px 0;"><strong>📦 Material:</strong> ${loanData.nombreMaterial}</p>
                            <p style="margin: 5px 0;"><strong>🔢 Cantidad:</strong> ${loanData.cantidad}</p>
                            <p style="margin: 5px 0;"><strong>📅 Fecha de devolución:</strong> ${fechaDevolucionFormateada}</p>
                            <p style="margin: 5px 0;"><strong>🏷️ Código:</strong> ${loanData.codigo || loanDoc.id}</p>
                          </div>
                          
                          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <p style="margin-bottom: 15px;"><strong>🎫 Usa este enlace para devolver el material:</strong></p>
                            
                            <a href="${qrUrl}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 10px 0;">
                              📱 Ver Código de Devolución
                            </a>
                            
                            <p style="font-size: 12px; color: #6b7280; margin-top: 15px;">
                              O copia este enlace: <br/>
                              <span style="background-color: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-family: monospace; font-size: 11px; word-break: break-all;">
                                ${qrUrl}
                              </span>
                            </p>
                          </div>
                          
                          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                            <p style="margin: 0; font-size: 14px;">
                              <strong>💡 Tip:</strong> Este código QR es válido hasta 2 horas después de la fecha de devolución. ¡Devuelve a tiempo para evitar adeudos!
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
                  stats.errors.push(`Email QR ${studentEmail}: ${emailError.message}`);
                }
              } else {
                console.log(`   ⚠️  Estudiante sin email válido`);
              }
              
            } catch (error: any) {
              console.error(`   ❌ Error generando QR:`, error);
              stats.errors.push(`QR ${loanDoc.id}: ${error.message}`);
            }
          }
        } else {
          console.log(`   ℹ️  No hay préstamos próximos a vencer (activos encontrados: ${activeLoansSnapshot.size})`);
        }
      } catch (error: any) {
        console.error(`   ❌ Error consultando préstamos activos:`, error.message);
        stats.errors.push(`Consulta activos ${studentDoc.id}: ${error.message}`);
      }
      
      console.log(''); // Línea en blanco
    }

    console.log("========================================");
    console.log("✅ SEND REMINDERS - FINALIZADO");
    console.log("========================================");
    console.log(`👥 Estudiantes procesados: ${studentsSnapshot.size}`);
    console.log(`📋 Préstamos activos analizados: ${stats.prestamosAnalizados}`);
    console.log(`💰 Adeudos creados: ${stats.adeudosCreados}`);
    console.log(`🎫 QR generados: ${stats.qrGenerados}`);
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
    console.error("\n❌❌❌ [CRON | send-reminders ERROR CRÍTICO] ❌❌❌");
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