import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, getRtdb } from '@/lib/firestore-operations-server';
import { FieldValue } from 'firebase-admin/firestore';

// --- Función de Verificación de Admin (ACTUALIZADA PARA OTP) ---
async function verifyAdminSession(sessionCookie: string) {
    const db = getDb();
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
        const adminDocRef = db.collection('admins').doc(sessionData.uid);
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

export async function POST(request: Request) {
    console.log("API /api/prestamos/activate HIT!");

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ message: "No autorizado: No hay sesión." }, { status: 401 });
    }

    const adminClaims = await verifyAdminSession(sessionCookie);

    if (!adminClaims) {
        return NextResponse.json({ message: "No autorizado: La sesión no es de un administrador válido." }, { status: 403 });
    }

    const db = getDb();
    const rtdb = getRtdb();

    try {
        const body = await request.json();
        const { codigo } = body;

        if (!codigo) {
            return NextResponse.json({ message: "El código QR es requerido." }, { status: 400 });
        }

        // 1. Obtener datos del QR
        const qrDocRef = db.collection('qrs').doc(codigo);
        const qrDoc = await qrDocRef.get();

        if (!qrDoc.exists) {
            return NextResponse.json({ message: `Código QR "${codigo}" no encontrado.` }, { status: 404 });
        }

        const qrData = qrDoc.data();

        if (qrData?.status !== 'pendiente') {
            return NextResponse.json({ message: `Este código QR ya fue procesado. Estado: ${qrData?.status}.` }, { status: 409 });
        }

        if (qrData.operationType !== 'prestamos') {
            return NextResponse.json({ message: `Este QR no es para una operación de préstamo.` }, { status: 400 });
        }

        // 2. Obtener datos del Préstamo
        const prestamoRef = db.collection('Estudiantes').doc(qrData.studentUid).collection('Prestamos').doc(qrData.operationId);
        const prestamoDoc = await prestamoRef.get();

        if (!prestamoDoc.exists) {
            return NextResponse.json({ message: `Error crítico: El préstamo asociado al QR no existe.` }, { status: 500 });
        }
        
        const prestamoData = prestamoDoc.data();
        const { materialId, cantidad } = prestamoData || {};

        console.log('=== DEBUG PRÉSTAMO ===');
        console.log('Préstamo Data:', prestamoData);
        console.log('Material ID:', materialId);
        console.log('Cantidad solicitada:', cantidad);

        if (!materialId || !cantidad) {
            return NextResponse.json({ message: `El préstamo no tiene un materialId o cantidad válida.` }, { status: 500 });
        }

        // 3. Verificar y actualizar stock en Realtime Database con transacción
        const materialRtdbRef = rtdb.ref(`materiales/${materialId}`);
        
        const { committed, snapshot } = await materialRtdbRef.transaction((currentData) => {
            if (currentData === null) {
                console.log(`Material ${materialId} no existe en RTDB`);
                return;
            }
            const currentStock = currentData.cantidad || 0;
            console.log(`Stock actual de ${materialId}: ${currentStock}, Solicitado: ${cantidad}`);
            
            if (currentStock >= cantidad) {
                currentData.cantidad = currentStock - cantidad;
                return currentData;
            } else {
                console.log(`Stock insuficiente: ${currentStock} < ${cantidad}`);
                return;
            }
        });

        if (!committed) {
            const currentStock = (await materialRtdbRef.once('value')).val()?.cantidad || 0;
            return NextResponse.json({ 
                message: `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${cantidad}` 
            }, { status: 409 });
        }

        // 4. Actualizar documentos en Firestore
        await db.runTransaction(async (transaction) => {
            transaction.update(prestamoRef, {
                estado: 'activo',
                fechaInicio: FieldValue.serverTimestamp()
            });
            transaction.update(qrDocRef, {
                status: 'validado',
                validatedBy: adminClaims.uid,
                validatedAt: FieldValue.serverTimestamp()
            });
        });

        const newStock = snapshot.val()?.cantidad;
        console.log(`Préstamo ${codigo} activado por ${adminClaims.uid}. Stock de ${materialId} actualizado a ${newStock}.`);

        return NextResponse.json({ message: "¡Préstamo activado con éxito!" });

    } catch (error: any) {
        console.error("Error fatal en /api/prestamos/activate:", error);
        return NextResponse.json({ 
            message: "Error interno del servidor al activar el préstamo.",
            details: error.message 
        }, { status: 500 });
    }
}