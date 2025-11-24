import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

// Configurar transporter para emails
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

/**
 * Función de Verificación de Admin (ACTUALIZADA PARA OTP)
 */
async function verifyAdminSession(sessionCookie: string) {
    try {
        const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
        
        const now = Date.now();
        if (now > sessionData.expiresAt) {
            console.error("La sesión ha expirado");
            return null;
        }

        if (!sessionData.admin || !sessionData.uid) {
            console.error("La sesión no tiene permisos de administrador");
            return null;
        }

        const adminDocRef = adminDb.collection('admins').doc(sessionData.uid);
        const adminDoc = await adminDocRef.get();
        
        if (!adminDoc.exists) {
            console.error("Admin no encontrado en la base de datos");
            return null;
        }

        return {
            uid: sessionData.uid,
            admin: true
        };
    } catch (error) {
        console.error("Error verificando la sesión de admin:", error);
        return null;
    }
}

/**
 * Buscar préstamo por qrToken en todos los estudiantes
 */
async function findLoanByQRToken(qrToken: string) {
    const studentsSnapshot = await adminDb.collection('Estudiantes').get();
    
    for (const studentDoc of studentsSnapshot.docs) {
        const loansSnapshot = await studentDoc.ref
            .collection('Prestamos')
            .where('qrToken', '==', qrToken)
            .limit(1)
            .get();
        
        if (!loansSnapshot.empty) {
            return {
                studentId: studentDoc.id,
                studentData: studentDoc.data(),
                loanDoc: loansSnapshot.docs[0],
                loanData: loansSnapshot.docs[0].data()
            };
        }
    }
    
    return null;
}

/**
 * Buscar adeudo por tokenDevolucion en todos los estudiantes
 */
async function findAdeudoByToken(token: string, tokenField: 'tokenDevolucion' | 'tokenPago') {
    const studentsSnapshot = await adminDb.collection('Estudiantes').get();
    
    for (const studentDoc of studentsSnapshot.docs) {
        const adeudosSnapshot = await studentDoc.ref
            .collection('Adeudos')
            .where(tokenField, '==', token)
            .limit(1)
            .get();
        
        if (!adeudosSnapshot.empty) {
            return {
                studentId: studentDoc.id,
                studentData: studentDoc.data(),
                adeudoDoc: adeudosSnapshot.docs[0],
                adeudoData: adeudosSnapshot.docs[0].data()
            };
        }
    }
    
    return null;
}

/**
 * API endpoint to validate a QR code against Firestore.
 */
export async function POST(request: Request) {
    console.log("API /api/admin/validate-qr HIT!");

    try {
        // Verificar sesión de admin
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('__session')?.value;

        if (!sessionCookie) {
            return NextResponse.json(
                { message: 'No autorizado: No hay sesión activa.' },
                { status: 401 }
            );
        }

        const adminClaims = await verifyAdminSession(sessionCookie);
        if (!adminClaims) {
            return NextResponse.json(
                { message: 'No autorizado: Sesión de administrador inválida.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { qrData } = body;

        if (!qrData || typeof qrData !== 'string') {
            console.log("Error: qrData is missing or not a string.", body);
            return NextResponse.json({ message: "No se proporcionó un código QR válido." }, { status: 400 });
        }

        console.log(`Initiating validation for QR ID: ${qrData}`);

        // ============================================
        // TIPO 1: QR del sistema antiguo (colección 'qrs')
        // ============================================
        const qrDocRef = adminDb.collection('qrs').doc(qrData);
        const qrDoc = await qrDocRef.get();

        if (qrDoc.exists) {
            const qrCodeData = qrDoc.data();
            const status = qrCodeData?.status;
            const operationId = qrCodeData?.operationId;
            const operationType = qrCodeData?.operationType;
            const studentUid = qrCodeData?.studentUid;

            if (!operationId || !operationType) {
                console.error(`Critical: QR document '${qrData}' is malformed.`);
                return NextResponse.json({ 
                    message: "El código QR está malformado y no se puede procesar." 
                }, { status: 500 });
            }
            
            if (status === 'validado') {
                console.log(`QR '${qrData}' already validated.`);
                return NextResponse.json(
                    {
                        message: `Este código QR ya fue utilizado anteriormente.`,
                        details: `Operación: ${operationType}`
                    },
                    { status: 409 }
                );
            }

            if (status === 'pendiente') {
                let operationRef;
                
                if (operationType === 'prestamos') {
                    if (!studentUid) {
                        return NextResponse.json({ 
                            message: "El código QR de préstamo está malformado." 
                        }, { status: 500 });
                    }
                    operationRef = adminDb
                        .collection('Estudiantes')
                        .doc(studentUid)
                        .collection('Prestamos')
                        .doc(operationId);
                } else {
                    operationRef = adminDb.collection(operationType).doc(operationId);
                }

                const operationDoc = await operationRef.get();
                if (!operationDoc.exists) {
                    return NextResponse.json({ 
                        message: "La operación asociada al QR no existe." 
                    }, { status: 500 });
                }

                await adminDb.runTransaction(async (transaction) => {
                    transaction.update(qrDocRef, {
                        status: 'validado',
                        validatedAt: Timestamp.now(),
                        validatedBy: adminClaims.uid
                    });

                    transaction.update(operationRef, {
                        estado: 'activo',
                        fechaInicio: Timestamp.now()
                    });
                });
                
                console.log(`Transaction successful: QR '${qrData}' validated.`);

                const operationData = operationDoc.data();
                return NextResponse.json(
                    {
                        message: `¡Operación de ${operationType} validada con éxito!`,
                        details: `${operationData?.nombreMaterial || operationData?.material || 'Operación'} - ${operationData?.cantidad ? `Cantidad: ${operationData.cantidad}` : operationId}`
                    },
                    { status: 200 }
                );
            }
        }

        // ============================================
        // TIPO 2: QR de Recordatorio/Devolución (qrToken en Prestamos)
        // ============================================
        const loanResult = await findLoanByQRToken(qrData);
        
        if (loanResult) {
            const { studentId, studentData, loanDoc, loanData } = loanResult;
            
            // Verificar validez del QR
            const now = Timestamp.now();
            if (loanData.qrValidoHasta && loanData.qrValidoHasta.toMillis() < now.toMillis()) {
                return NextResponse.json(
                    { message: 'Este código QR ha expirado.' },
                    { status: 410 }
                );
            }

            // Marcar préstamo como devuelto y moverlo a Completados
            await adminDb.runTransaction(async (transaction) => {
                const completadoRef = adminDb
                    .collection('Estudiantes')
                    .doc(studentId)
                    .collection('Completados')
                    .doc(loanDoc.id);

                const completadoData = {
                    ...loanData,
                    estado: 'devuelto',
                    fechaDevolucionReal: Timestamp.now(),
                    validadoPor: adminClaims.uid
                };

                transaction.set(completadoRef, completadoData);
                transaction.delete(loanDoc.ref);
            });

            // Enviar email de confirmación
            if (studentData.correo) {
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: studentData.correo,
                        subject: `✅ Devolución Confirmada - ${loanData.nombreMaterial}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                                <div style="background-color: #10b981; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                                    <h2 style="color: white; margin: 0;">✅ Devolución Confirmada</h2>
                                </div>
                                <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                                    <p>Hola <strong>${studentData.nombre}</strong>,</p>
                                    <p>Tu devolución ha sido confirmada exitosamente:</p>
                                    <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>📦 Material:</strong> ${loanData.nombreMaterial}</p>
                                        <p><strong>🔢 Cantidad:</strong> ${loanData.cantidad}</p>
                                        <p><strong>✅ Estado:</strong> Devuelto</p>
                                    </div>
                                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                                        Gracias por devolver el material a tiempo.
                                    </p>
                                </div>
                            </div>
                        `
                    });
                } catch (emailError: any) {
                    console.error('Error enviando email:', emailError);
                }
            }

            return NextResponse.json(
                {
                    message: `¡Devolución confirmada con éxito!`,
                    details: `${loanData.nombreMaterial} - Cantidad: ${loanData.cantidad}`
                },
                { status: 200 }
            );
        }

        // ============================================
        // TIPO 3: QR de Devolución de Adeudo (tokenDevolucion)
        // ============================================
        const adeudoDevolucionResult = await findAdeudoByToken(qrData, 'tokenDevolucion');
        
        if (adeudoDevolucionResult) {
            const { studentId, studentData, adeudoDoc, adeudoData } = adeudoDevolucionResult;

            // Cambiar estado del adeudo a "devuelto"
            await adeudoDoc.ref.update({
                estado: 'devuelto',
                fechaDevolucion: Timestamp.now(),
                validadoPor: adminClaims.uid
            });

            // Enviar email de confirmación
            if (studentData.correo) {
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: studentData.correo,
                        subject: `✅ Material Devuelto - Adeudo Resuelto`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                                <div style="background-color: #10b981; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                                    <h2 style="color: white; margin: 0;">✅ Material Devuelto</h2>
                                </div>
                                <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                                    <p>Hola <strong>${studentData.nombre}</strong>,</p>
                                    <p>Has devuelto el material exitosamente. Tu adeudo ha sido resuelto:</p>
                                    <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>📦 Material:</strong> ${adeudoData.nombreMaterial}</p>
                                        <p><strong>🔢 Cantidad:</strong> ${adeudoData.cantidad}</p>
                                        <p><strong>🔖 Código:</strong> ${adeudoData.codigo}</p>
                                        <p><strong>✅ Estado:</strong> Devuelto - Adeudo Resuelto</p>
                                    </div>
                                    <p>Ya no tienes pendientes con el laboratorio.</p>
                                </div>
                            </div>
                        `
                    });
                } catch (emailError: any) {
                    console.error('Error enviando email:', emailError);
                }
            }

            return NextResponse.json(
                {
                    message: `¡Material devuelto! Adeudo resuelto.`,
                    details: `${adeudoData.nombreMaterial} - ${adeudoData.codigo}`
                },
                { status: 200 }
            );
        }

        // ============================================
        // TIPO 4: QR de Pago Presencial (tokenPago)
        // ============================================
        const adeudoPagoResult = await findAdeudoByToken(qrData, 'tokenPago');
        
        if (adeudoPagoResult) {
            const { studentId, studentData, adeudoDoc, adeudoData } = adeudoPagoResult;

            // Generar código de pago
            const codigoPago = `PAGO-${adeudoData.grupo || 'XXX'}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

            await adminDb.runTransaction(async (transaction) => {
                // 1. Cambiar estado del adeudo a "pagado"
                transaction.update(adeudoDoc.ref, {
                    estado: 'pagado',
                    fechaPago: Timestamp.now(),
                    codigoPago: codigoPago,
                    validadoPor: adminClaims.uid
                });

                // 2. Crear registro en Pagados
                const pagadoRef = adminDb
                    .collection('Estudiantes')
                    .doc(studentId)
                    .collection('Pagados')
                    .doc();

                const pagoData = {
                    codigoPago: codigoPago,
                    nombreMaterial: adeudoData.nombreMaterial,
                    precio: adeudoData.precio_ajustado || 0,
                    metodo: 'presencial',
                    estado: 'pagado',
                    fechaPago: Timestamp.now(),
                    adeudoOriginal: adeudoDoc.id,
                    grupo: adeudoData.grupo || '',
                    validadoPor: adminClaims.uid
                };

                transaction.set(pagadoRef, pagoData);
            });

            // Enviar email de confirmación
            if (studentData.correo) {
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: studentData.correo,
                        subject: `✅ Pago Confirmado - ${adeudoData.nombreMaterial}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                                <div style="background-color: #10b981; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                                    <h2 style="color: white; margin: 0;">✅ Pago Confirmado</h2>
                                </div>
                                <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
                                    <p>Hola <strong>${studentData.nombre}</strong>,</p>
                                    <p>Tu pago ha sido procesado exitosamente:</p>
                                    <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>📦 Material:</strong> ${adeudoData.nombreMaterial}</p>
                                        <p><strong>💵 Monto:</strong> $${(adeudoData.precio_ajustado || 0).toFixed(2)} MXN</p>
                                        <p><strong>🔖 Código de pago:</strong> ${codigoPago}</p>
                                        <p><strong>✅ Estado:</strong> Pagado</p>
                                    </div>
                                    <p>Tu adeudo ha sido liquidado. Gracias por tu pago.</p>
                                </div>
                            </div>
                        `
                    });
                } catch (emailError: any) {
                    console.error('Error enviando email:', emailError);
                }
            }

            return NextResponse.json(
                {
                    message: `¡Pago confirmado con éxito!`,
                    details: `${adeudoData.nombreMaterial} - $${(adeudoData.precio_ajustado || 0).toFixed(2)} MXN`
                },
                { status: 200 }
            );
        }

        // Si no se encontró ningún QR válido
        console.log(`QR '${qrData}' not found in any system.`);
        return NextResponse.json({ 
            message: "Código QR no reconocido o inválido." 
        }, { status: 404 });

    } catch (error: any) {
        console.error("Fatal error in QR validation endpoint:", error);
        return NextResponse.json({ 
            message: "Ocurrió un error interno grave al validar el código QR.",
            details: error.message 
        }, { status: 500 });
    }
}

/**
 * GET handler for testing purposes.
 */
export async function GET() {
    return NextResponse.json({ 
        message: "QR validation endpoint is active. Use POST to validate a QR code." 
    });
}