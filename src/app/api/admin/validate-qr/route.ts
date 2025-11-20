import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Función de Verificación de Admin (ACTUALIZADA PARA OTP)
 */
async function verifyAdminSession(sessionCookie: string) {
    try {
        // Decodificar la cookie de sesión
        const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
        
        // Verificar que no haya expirado
        const now = Date.now();
        if (now > sessionData.expiresAt) {
            console.error("La sesión ha expirado");
            return null;
        }

        // Verificar que sea una sesión de admin
        if (!sessionData.admin || !sessionData.uid) {
            console.error("La sesión no tiene permisos de administrador");
            return null;
        }

        // Verificar que el admin existe en Firestore
        const adminDocRef = adminDb.collection('admins').doc(sessionData.uid);
        const adminDoc = await adminDocRef.get();
        
        if (!adminDoc.exists) {
            console.error("Admin no encontrado en la base de datos");
            return null;
        }

        // Retornar datos de la sesión
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

        const qrDocRef = adminDb.collection('qrs').doc(qrData);
        const qrDoc = await qrDocRef.get();

        if (!qrDoc.exists) {
            console.log(`Validation failed: QR document '${qrData}' not found in Firestore.`);
            return NextResponse.json({ message: "Código QR no reconocido o inválido." }, { status: 404 });
        }

        const qrCodeData = qrDoc.data();
        const status = qrCodeData?.status;
        const operationId = qrCodeData?.operationId;
        const operationType = qrCodeData?.operationType;
        const studentUid = qrCodeData?.studentUid; // ✅ NUEVO: Necesitamos el UID del estudiante

        if (!operationId || !operationType) {
            console.error(`Critical: QR document '${qrData}' is malformed. Missing operationId or operationType.`);
            return NextResponse.json({ message: "El código QR está malformado y no se puede procesar." }, { status: 500 });
        }
        
        if (status === 'validado') {
            console.log(`Validation warning: QR '${qrData}' has already been validated.`);
            return NextResponse.json(
                {
                    message: `Este código QR ya fue utilizado anteriormente.`,
                    details: `Operación: ${operationType}`
                },
                { status: 409 }
            );
        }

        if (status === 'pendiente') {
            console.log(`Validation success: QR '${qrData}' is pending. Proceeding to validate.`);

            // ✅ CORRECCIÓN: Manejar diferentes tipos de operaciones
            let operationRef;
            
            if (operationType === 'prestamos') {
                // Para préstamos: Estudiantes/{studentUid}/Prestamos/{operationId}
                if (!studentUid) {
                    console.error(`Critical: QR document '${qrData}' for prestamos is missing studentUid.`);
                    return NextResponse.json({ 
                        message: "El código QR de préstamo está malformado (falta studentUid)." 
                    }, { status: 500 });
                }
                operationRef = adminDb
                    .collection('Estudiantes')
                    .doc(studentUid)
                    .collection('Prestamos')
                    .doc(operationId);
            } else {
                // Para otros tipos (adeudos, etc.): colección directa
                operationRef = adminDb.collection(operationType).doc(operationId);
            }

            // Verificar que el documento de operación existe
            const operationDoc = await operationRef.get();
            if (!operationDoc.exists) {
                console.error(`Critical: Operation document not found for '${operationId}' in '${operationType}'`);
                return NextResponse.json({ 
                    message: "Error crítico: La operación asociada al QR no existe." 
                }, { status: 500 });
            }

            // Use a transaction to ensure atomicity
            await adminDb.runTransaction(async (transaction) => {
                // 1. Update the QR document
                transaction.update(qrDocRef, {
                    status: 'validado',
                    validatedAt: Timestamp.now(),
                    validatedBy: adminClaims.uid
                });

                // 2. Update the corresponding operation document
                transaction.update(operationRef, {
                    estado: 'activo', // o 'entregado' según tu lógica
                    fechaInicio: Timestamp.now()
                });
            });
            
            console.log(`Transaction successful: QR '${qrData}' and Operation '${operationId}' have been updated by admin ${adminClaims.uid}.`);

            const operationData = operationDoc.data();
            return NextResponse.json(
                {
                    message: `¡Operación de ${operationType} validada con éxito!`,
                    details: `${operationData?.nombreMaterial || operationData?.material || 'Operación'} - ${operationData?.cantidad ? `Cantidad: ${operationData.cantidad}` : operationId}`
                },
                { status: 200 }
            );
        }

        console.warn(`Unknown status '${status}' for QR '${qrData}'.`);
        return NextResponse.json({ 
            message: `El estado del QR ('${status}') es desconocido y no se puede procesar.` 
        }, { status: 500 });

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