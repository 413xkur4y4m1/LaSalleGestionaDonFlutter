import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

// Configurar transporter de Outlook
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: { ciphers: 'SSLv3' }
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
    errors: [] as string[]
  };

  try {
    const studentsSnapshot = await db.collection('Estudiantes').get();
    
    if (studentsSnapshot.empty) {
      return NextResponse.json({ message: "No se encontraron estudiantes." });
    }

    console.log(`📊 Total de estudiantes: ${studentsSnapshot.size}\n`);

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const studentEmail = studentData.correo;
      const loansRef = studentDoc.ref.collection('Prestamos');
      
      console.log(`👤 Procesando: ${studentData.nombre || studentDoc.id}`);

      // ============================================
      // PARTE 1: CONVERTIR EXPIRADOS A ADEUDOS
      // ============================================
      const expiredLoansQuery = loansRef
        .where('estado', '==', 'expirado')
        .where('fechaExpiracion', '<', twentyFourHoursAgo);
      
      const expiredLoans = await expiredLoansQuery.get();
      
      if (!expiredLoans.empty) {
        console.log(`   ⚠️  ${expiredLoans.size} préstamos expirados hace más de 24h`);
        
        for (const loanDoc of expiredLoans.docs) {
          try {
            const loanData = loanDoc.data();
            
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
            const adeudoCodigo = `ADEU-${loanData.grupo}-${Math.floor(Math.random() * 100000)}`;
            
            // Crear adeudo
            await studentDoc.ref.collection('Adeudos').add({
              codigo: adeudoCodigo,
              nombreMaterial: loanData.nombreMaterial,
              cantidad: loanData.cantidad,
              precio_unitario: loanData.precio_unitario,
              precio_ajustado: loanData.precio_total, // Mismo precio por ahora
              moneda: 'MXN',
              estado: 'pendiente',
              tipo: 'vencimiento',
              fechaVencimiento: loanData.fechaDevolucion,
              grupo: loanData.grupo,
              prestamoOriginal: loanDoc.id,
              fechaCreacion: admin.firestore.Timestamp.now()
            });
            
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
            
          } catch (error: any) {
            console.error(`   ❌ Error creando adeudo:`, error);
            stats.errors.push(`Adeudo ${loanDoc.id}: ${error.message}`);
          }
        }
      }

      // ============================================
      // PARTE 2: GENERAR QR PARA PRÓXIMOS A VENCER
      // ============================================
      const upcomingLoansQuery = loansRef
        .where('estado', '==', 'activo')
        .where('fechaDevolucion', '>=', now)
        .where('fechaDevolucion', '<=', oneDayAhead);
      
      const upcomingLoans = await upcomingLoansQuery.get();
      
      if (!upcomingLoans.empty) {
        console.log(`   ⏰ ${upcomingLoans.size} préstamos vencen en las próximas 24h`);
        
        for (const loanDoc of upcomingLoans.docs) {
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
            const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.vercel.app'}/devolucion/${qrToken}`;
            
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
            if (studentEmail) {
              try {
                await transporter.sendMail({
                  from: process.env.EMAIL_USER,
                  to: studentEmail,
                  subject: `⏰ Recordatorio: Tu préstamo vence pronto`,
                  html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                      <h2 style="color: #dc2626;">⏰ Recordatorio de Devolución</h2>
                      <p>Hola <strong>${studentData.nombre}</strong>,</p>
                      
                      <p>Tu préstamo de <strong>${loanData.nombreMaterial}</strong> vence pronto:</p>
                      
                      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>📦 Material:</strong> ${loanData.nombreMaterial}</p>
                        <p><strong>📅 Fecha de devolución:</strong> ${loanData.fechaDevolucion.toDate().toLocaleString('es-MX')}</p>
                        <p><strong>🔢 Cantidad:</strong> ${loanData.cantidad}</p>
                      </div>
                      
                      <p><strong>Para devolver el material, escanea este código QR:</strong></p>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${qrUrl}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                          Ver código de devolución
                        </a>
                      </div>
                      
                      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                        Este es un correo automático. Por favor no respondas a este mensaje.
                      </p>
                    </div>
                  `,
                });
                
                stats.emailsEnviados++;
                console.log(`   📧 Email enviado a: ${studentEmail}`);
                
              } catch (emailError: any) {
                console.error(`   ❌ Error enviando email:`, emailError);
                stats.errors.push(`Email ${studentEmail}: ${emailError.message}`);
              }
            }
            
          } catch (error: any) {
            console.error(`   ❌ Error generando QR:`, error);
            stats.errors.push(`QR ${loanDoc.id}: ${error.message}`);
          }
        }
      }
      
      console.log(''); // Línea en blanco
    }

    console.log("========================================");
    console.log("✅ SEND REMINDERS - FINALIZADO");
    console.log("========================================");
    console.log(`💰 Adeudos creados: ${stats.adeudosCreados}`);
    console.log(`🎫 QR generados: ${stats.qrGenerados}`);
    console.log(`📧 Emails enviados: ${stats.emailsEnviados}`);
    if (stats.errors.length > 0) {
      console.error(`⚠️ Errores: ${stats.errors.length}`);
      console.error(stats.errors);
    }
    console.log("\n");

    return NextResponse.json({ 
      success: true,
      message: "Proceso completado exitosamente",
      ...stats
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