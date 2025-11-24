// /app/api/procesar-pago/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firestore-operations-server';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentId,
      adeudoId,
      uid,
      monto,
      metodoPago,
      cardData
    } = body;

    // ⭐ VALIDAR Y NORMALIZAR EL MONTO
    const montoSeguro = parseFloat(monto) || 0;

    if (!paymentId || !adeudoId || !uid || montoSeguro <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Datos incompletos o monto inválido'
      }, { status: 400 });
    }

    const db = getDb();
    const studentRef = db.collection('Estudiantes').doc(uid);
    const adeudoRef = studentRef.collection('Adeudos').doc(adeudoId);
    
    // Obtener datos del adeudo y estudiante
    const [adeudoDoc, studentDoc] = await Promise.all([
      adeudoRef.get(),
      studentRef.get()
    ]);

    if (!adeudoDoc.exists || !studentDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Adeudo o estudiante no encontrado'
      }, { status: 404 });
    }

    const adeudoData = adeudoDoc.data();
    const studentData = studentDoc.data();

    // TODO: AQUÍ IRÍA LA INTEGRACIÓN REAL CON LA PASARELA DE PAGO
    // Por ejemplo, con Stripe:
    // const paymentIntent = await stripe.paymentIntents.create({...});
    
    // SIMULACIÓN DE PAGO EXITOSO (solo para desarrollo)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular procesamiento
    
    const transaccionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generar código de pago
    const codigoPago = `PAGO-${adeudoData?.grupo || 'XXX'}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    
    // Crear documento en Pagados
    const pagoData = {
      codigoPago: codigoPago,
      nombreMaterial: adeudoData?.nombreMaterial || '',
      precio: montoSeguro, // ⭐ Usar monto seguro
      metodo: 'en línea',
      estado: 'pagado',
      fechaPago: admin.firestore.Timestamp.now(),
      adeudoOriginal: adeudoId,
      grupo: adeudoData?.grupo || '',
      transaccionId: transaccionId,
      paymentId: paymentId,
      metodoPagoDetalle: metodoPago,
      ultimosCuatroDigitos: cardData?.lastFour || ''
    };

    // Usar batch para operaciones atómicas
    const batch = db.batch();
    
    // 1. Cambiar estado del adeudo a "pagado"
    batch.update(adeudoRef, {
      estado: 'pagado',
      fechaPago: admin.firestore.Timestamp.now(),
      transaccionId: transaccionId,
      codigoPago: codigoPago
    });
    
    // 2. Crear en colección Pagados
    const pagadoRef = studentRef.collection('Pagados').doc();
    batch.set(pagadoRef, pagoData);
    
    // 3. Crear notificación
    const notificationRef = studentRef.collection('Notificaciones').doc();
    batch.set(notificationRef, {
      tipo: 'pago',
      adeudoId: adeudoId,
      mensaje: `✅ Pago exitoso de ${adeudoData?.nombreMaterial}. Tu adeudo ha sido liquidado.`,
      enviado: true,
      fechaEnvio: admin.firestore.Timestamp.now(),
      canal: 'interno',
      leida: false
    });
    
    await batch.commit();
    
    // Enviar email de confirmación
    if (studentData?.correo) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: studentData.correo,
        subject: `✅ Pago Exitoso - ${adeudoData?.nombreMaterial}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">✅ Pago Exitoso</h2>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hola <strong>${studentData.nombre}</strong>,</p>
              
              <p>Tu pago ha sido procesado exitosamente. Tu adeudo ha sido liquidado.</p>
              
              <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 5px 0;"><strong>📦 Material:</strong> ${adeudoData?.nombreMaterial}</p>
                <p style="margin: 5px 0;"><strong>💵 Monto pagado:</strong> $${montoSeguro.toFixed(2)} MXN</p>
                <p style="margin: 5px 0;"><strong>🔖 Código de pago:</strong> ${codigoPago}</p>
                <p style="margin: 5px 0;"><strong>🆔 ID de transacción:</strong> ${transaccionId}</p>
                <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
              </div>
              
              <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>✅ Estado:</strong> Tu adeudo ha sido marcado como <strong>PAGADO</strong>. Ya no tienes pendientes con el laboratorio.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <p style="margin: 0; font-size: 24px; color: #10b981;">✓</p>
                <p style="margin: 10px 0 0 0; font-weight: bold; color: #059669;">Gracias por tu pago</p>
              </div>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                Este es un correo automático del Sistema de Préstamos de Laboratorio.<br/>
                Conserva este correo como comprobante de pago.
              </p>
            </div>
          </div>
        `
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pago procesado exitosamente',
      transaccionId: transaccionId,
      codigoPago: codigoPago
    });

  } catch (error: any) {
    console.error('[API | Procesar Pago]:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al procesar el pago',
      error: error.message
    }, { status: 500 });
  }
}