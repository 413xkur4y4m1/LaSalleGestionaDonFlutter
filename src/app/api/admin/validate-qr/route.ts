
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * API endpoint to validate a QR code against Firestore.
 * 
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} A response object with the result of the validation.
 */
export async function POST(request: Request) {
    console.log("API /api/admin/validate-qr HIT!");

    try {
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
        const operationType = qrCodeData?.operationType; // e.g., 'prestamo' or 'adeudo'

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
                { status: 409 } // 409 Conflict
            );
        }

        if (status === 'pendiente') {
            console.log(`Validation success: QR '${qrData}' is pending. Proceeding to validate.`);

            // Use a transaction to ensure atomicity
            await adminDb.runTransaction(async (transaction) => {
                const operationRef = adminDb.collection(operationType).doc(operationId);
                
                // 1. Update the QR document
                transaction.update(qrDocRef, {
                    status: 'validado',
                    validatedAt: Timestamp.now(),
                    // You could also add which admin validated it if you have user info
                });

                // 2. Update the corresponding operation document (prestamo or adeudo)
                transaction.update(operationRef, {
                    status: 'entregado' // Or 'pagado', 'recibido', etc. as per your logic
                });
            });
            
            console.log(`Transaction successful: QR '${qrData}' and Operation '${operationId}' have been updated.`);

            return NextResponse.json(
                {
                    message: `¡Operación de ${operationType} validada con éxito!`,
                    details: `ID de Operación: ${operationId}`
                },
                { status: 200 }
            );
        }

        console.warn(`Unknown status '${status}' for QR '${qrData}'.`);
        return NextResponse.json({ message: `El estado del QR ('${status}') es desconocido y no se puede procesar.` }, { status: 500 });

    } catch (error) {
        console.error("Fatal error in QR validation endpoint:", error);
        // Avoid leaking detailed error info to the client
        return NextResponse.json({ message: "Ocurrió un error interno grave al validar el código QR." }, { status: 500 });
    }
}


/**
* GET handler for testing purposes.
*/
export async function GET() {
    return NextResponse.json({ message: "QR validation endpoint is active. Use POST to validate a QR code." });
}
