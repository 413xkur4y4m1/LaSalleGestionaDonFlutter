// /app/api/formularios/[formId]/responder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

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

function generateQRCodeDataURL(text: string, size: number = 300): string {
  const encodedText = encodeURIComponent(text);
  return `https://quickchart.io/qr?text=${encodedText}&size=${size}&margin=1`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    
    const {
      respuesta,
      metodoPago,
      adeudoId,
      uid,
      correoEstudiante,
      nombreEstudiante,
      nombreMaterial,
      cantidad,
      codigoAdeudo,
      grupo,
      precio_ajustado
    } = body;

    if (!respuesta || !adeudoId || !uid) {
      return NextResponse.json({
        success: false,
        message: 'Datos incompletos'
      }, { status: 400 });
    }

    // ⭐ VALIDAR Y NORMALIZAR EL PRECIO
    const montoSeguro = parseFloat(precio_ajustado) || 0;
    const montoFormateado = montoSeguro.toFixed(2);

    const db = getDb();
    const batch = db.batch();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.vercel.app';
    
    const studentRef = db.collection('Estudiantes').doc(uid);
    const adeudoRef = studentRef.collection('Adeudos').doc(adeudoId);
    const globalFormRef = db.collection('FormulariosGlobal').doc(formId);
    const studentFormRef = studentRef.collection('Formularios').doc(formId);

    // Actualizar formulario a completado
    const formUpdate = {
      respuesta: respuesta,
      estado: 'completado',
      fechaRespuesta: admin.firestore.Timestamp.now()
    };
    
    batch.update(globalFormRef, formUpdate);
    batch.update(studentFormRef, formUpdate);

    let responseData: any = {
      success: true,
      message: ''
    };

    // ============================================
    // OPCIÓN 1: "Lo tengo pero no lo he devuelto"
    // ============================================
    if (respuesta === 'Lo tengo pero no lo he devuelto') {
      // Generar token de devolución sin límite de tiempo
      const devolucionToken = randomBytes(32).toString('hex');
      const qrDevolucionUrl = `${baseUrl}/scan-devolucion-material/${devolucionToken}`;
      
      // Actualizar adeudo con token de devolución
      batch.update(adeudoRef, {
        tokenDevolucion: devolucionToken,
        qrDevolucionUrl: qrDevolucionUrl,
        respuestaFormulario: respuesta,
        fechaRespuestaFormulario: admin.firestore.Timestamp.now()
      });
      
      await batch.commit();
      
      // Enviar email con QR de devolución
      if (correoEstudiante) {
        const qrImageUrl = generateQRCodeDataURL(qrDevolucionUrl, 300);
        
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: correoEstudiante,
          subject: `📦 Código QR para Devolución - ${nombreMaterial}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #10b981; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h2 style="color: white; margin: 0;">📦 Código de Devolución</h2>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                <p>Hola <strong>${nombreEstudiante}</strong>,</p>
                
                <p>Gracias por completar el formulario. Aquí está tu código QR para devolver el material:</p>
                
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 5px 0;"><strong>📦 Material:</strong> ${nombreMaterial}</p>
                  <p style="margin: 5px 0;"><strong>🔢 Cantidad:</strong> ${cantidad}</p>
                  <p style="margin: 5px 0;"><strong>🔖 Código:</strong> ${codigoAdeudo}</p>
                </div>
                
                <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 3px solid #10b981;">
                  <p style="margin-bottom: 15px; font-size: 16px;"><strong>📱 Tu Código QR de Devolución:</strong></p>
                  
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                    <img src="${qrImageUrl}" alt="Código QR" style="max-width: 300px; width: 100%; height: auto; display: block;" />
                  </div>
                  
                  <p style="font-size: 14px; color: #374151; margin: 15px 0;">
                    Presenta este código en el laboratorio para devolver tu material
                  </p>
                  
                  <p style="font-size: 11px; color: #6b7280; margin-top: 15px; padding: 10px; background-color: #f9fafb; border-radius: 4px; word-break: break-all; font-family: monospace;">
                    ${qrDevolucionUrl}
                  </p>
                </div>
                
                <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <p style="margin: 0; font-size: 14px;">
                    <strong>💡 Importante:</strong> Este código QR no tiene límite de tiempo. Devuelve el material cuando puedas para resolver tu adeudo.
                  </p>
                </div>
                
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                  Este es un correo automático del Sistema de Préstamos de Laboratorio.<br/>
                  Por favor no respondas a este mensaje.
                </p>
              </div>
            </div>
          `
        });
      }
      
      responseData.message = 'Se ha enviado un código QR de devolución a tu correo';
      responseData.qrUrl = qrDevolucionUrl;
    }
    
    // ============================================
    // OPCIÓN 2 y 3: "Lo rompí" o "Lo perdí"
    // ============================================
    else if (respuesta === 'Lo rompí' || respuesta === 'Lo perdí') {
      
      if (!metodoPago) {
        return NextResponse.json({
          success: false,
          message: 'Método de pago requerido'
        }, { status: 400 });
      }
      
      // Actualizar tipo del adeudo
      const nuevoTipo = respuesta === 'Lo rompí' ? 'rotura' : 'perdida';
      
      // --- PAGO EN LÍNEA ---
      if (metodoPago === 'en línea') {
        // Generar ID único de pago
        const paymentId = `PAY-${Date.now()}-${randomBytes(8).toString('hex')}`;
        
        // Actualizar adeudo
        batch.update(adeudoRef, {
          tipo: nuevoTipo,
          respuestaFormulario: respuesta,
          metodoPagoSeleccionado: 'en línea',
          paymentId: paymentId,
          fechaRespuestaFormulario: admin.firestore.Timestamp.now()
        });
        
        await batch.commit();
        
        // ⭐ URL de pago con monto seguro
        const paymentUrl = `${baseUrl}/pago/${paymentId}?adeudo=${adeudoId}&uid=${uid}&monto=${montoFormateado}`;
        
        // Enviar email con link de pago
        if (correoEstudiante) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: correoEstudiante,
            subject: `💳 Link de Pago - ${nombreMaterial}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #3b82f6; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h2 style="color: white; margin: 0;">💳 Realizar Pago en Línea</h2>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                  <p>Hola <strong>${nombreEstudiante}</strong>,</p>
                  
                  <p>Gracias por completar el formulario. Has indicado que <strong>"${respuesta}"</strong>.</p>
                  
                  <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <p style="margin: 5px 0;"><strong>📦 Material:</strong> ${nombreMaterial}</p>
                    <p style="margin: 5px 0;"><strong>🔢 Cantidad:</strong> ${cantidad}</p>
                    <p style="margin: 5px 0;"><strong>💵 Monto a pagar:</strong> $${montoFormateado} MXN</p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${paymentUrl}" style="background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                      💳 Pagar Ahora
                    </a>
                  </div>
                  
                  <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong>💡 Importante:</strong> Una vez completado el pago, tu adeudo será marcado como pagado automáticamente.
                    </p>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    Este es un correo automático del Sistema de Préstamos de Laboratorio.<br/>
                    Por favor no respondas a este mensaje.
                  </p>
                </div>
              </div>
            `
          });
        }
        
        responseData.message = 'Serás redirigido a la página de pago';
        responseData.paymentUrl = paymentUrl;
      }
      
      // --- PAGO PRESENCIAL ---
      else if (metodoPago === 'presencial') {
        // Generar token de pago presencial
        const pagoToken = randomBytes(32).toString('hex');
        const qrPagoUrl = `${baseUrl}/scan-pago-presencial/${pagoToken}`;
        
        // Actualizar adeudo
        batch.update(adeudoRef, {
          tipo: nuevoTipo,
          respuestaFormulario: respuesta,
          metodoPagoSeleccionado: 'presencial',
          tokenPago: pagoToken,
          qrPagoUrl: qrPagoUrl,
          fechaRespuestaFormulario: admin.firestore.Timestamp.now()
        });
        
        await batch.commit();
        
        // Enviar email con QR de pago presencial
        if (correoEstudiante) {
          const qrImageUrl = generateQRCodeDataURL(qrPagoUrl, 300);
          
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: correoEstudiante,
            subject: `💵 Código QR para Pago Presencial - ${nombreMaterial}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #10b981; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h2 style="color: white; margin: 0;">💵 Código de Pago Presencial</h2>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                  <p>Hola <strong>${nombreEstudiante}</strong>,</p>
                  
                  <p>Gracias por completar el formulario. Has indicado que <strong>"${respuesta}"</strong>.</p>
                  
                  <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <p style="margin: 5px 0;"><strong>📦 Material:</strong> ${nombreMaterial}</p>
                    <p style="margin: 5px 0;"><strong>🔢 Cantidad:</strong> ${cantidad}</p>
                    <p style="margin: 5px 0;"><strong>💵 Monto a pagar:</strong> $${montoFormateado} MXN</p>
                    <p style="margin: 5px 0;"><strong>🔖 Código:</strong> ${codigoAdeudo}</p>
                  </div>
                  
                  <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 3px solid #10b981;">
                    <p style="margin-bottom: 15px; font-size: 16px;"><strong>📱 Tu Código QR de Pago:</strong></p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                      <img src="${qrImageUrl}" alt="Código QR de Pago" style="max-width: 300px; width: 100%; height: auto; display: block;" />
                    </div>
                    
                    <p style="font-size: 14px; color: #374151; margin: 15px 0;">
                      Presenta este código en caja del laboratorio para realizar tu pago
                    </p>
                    
                    <p style="font-size: 11px; color: #6b7280; margin-top: 15px; padding: 10px; background-color: #f9fafb; border-radius: 4px; word-break: break-all; font-family: monospace;">
                      ${qrPagoUrl}
                    </p>
                  </div>
                  
                  <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.8;">
                      <strong>💡 Instrucciones:</strong><br/>
                      1. Acércate a caja del laboratorio<br/>
                      2. Presenta este código QR<br/>
                      3. Realiza el pago en efectivo o tarjeta<br/>
                      4. El encargado escaneará el código para confirmar tu pago
                    </p>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    Este es un correo automático del Sistema de Préstamos de Laboratorio.<br/>
                    Por favor no respondas a este mensaje.
                  </p>
                </div>
              </div>
            `
          });
        }
        
        responseData.message = 'Se ha enviado un código QR de pago a tu correo';
        responseData.qrUrl = qrPagoUrl;
      }
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('[API | Responder Formulario]:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al procesar la respuesta',
      error: error.message
    }, { status: 500 });
  }
}