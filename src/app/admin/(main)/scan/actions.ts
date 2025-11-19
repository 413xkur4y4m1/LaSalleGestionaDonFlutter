
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getDb, getRtdb } from '@/lib/firestore-operations-server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

// The admin verification function, now using getDb()
async function verifyAdminSession(sessionCookie: string) {
    const db = getDb();
    try {
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
        const adminDocRef = db.collection('admins').doc(decodedClaims.uid);
        const adminDoc = await adminDocRef.get();
        return adminDoc.exists ? decodedClaims : null;
    } catch (error) {
        console.error("Error verificando la sesión de admin:", error);
        return null;
    }
}

// --- Server Action to Activate Loan ---
export async function activatePrestamoAction(codigo: string) {
    // 1. SESSION VERIFICATION
    // CORRECTED: Added 'await' before 'cookies()'
    const sessionCookie = (await cookies()).get('__session')?.value;
    if (!sessionCookie) {
        return { success: false, message: 'No autorizado: No hay sesión.' };
    }

    const adminClaims = await verifyAdminSession(sessionCookie);
    if (!adminClaims) {
        return { success: false, message: 'No autorizado: La sesión no es de un administrador válido.' };
    }

    // 2. ACTIVATION LOGIC
    const db = getDb();
    const rtdb = getRtdb();

    try {
        const qrDocRef = db.collection('qrs').doc(codigo);
        const qrDoc = await qrDocRef.get();

        if (!qrDoc.exists) {
            return { success: false, message: `Código QR "${codigo}" no encontrado.` };
        }

        const qrData = qrDoc.data();
        if (qrData?.status !== 'pendiente') {
            return { success: false, message: `Este QR ya fue procesado. Estado: ${qrData?.status}.` };
        }

        if (qrData.operationType !== 'prestamos') {
            return { success: false, message: `Este QR no es para una operación de préstamo.` };
        }

        const prestamoRef = db.collection('Estudiantes').doc(qrData.studentUid).collection('Prestamos').doc(qrData.operationId);
        const prestamoDoc = await prestamoRef.get();

        if (!prestamoDoc.exists) {
            return { success: false, message: 'Error crítico: El préstamo asociado al QR no existe.' };
        }

        const prestamoData = prestamoDoc.data();
        const { materialId, cantidad } = prestamoData || {};
        if (!materialId) {
             return { success: false, message: 'El préstamo no tiene un materialId asociado.' };
        }

        const materialRtdbRef = rtdb.ref(`materiales/${materialId}`);
        const materialSnapshot = await materialRtdbRef.once('value');
        const currentStock = materialSnapshot.val()?.cantidad || 0;

        if (currentStock < cantidad) {
            return { success: false, message: `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${cantidad}` };
        }

        await db.runTransaction(async (transaction) => {
            transaction.update(prestamoRef, { estado: 'activo', fechaInicio: FieldValue.serverTimestamp() });
            transaction.update(qrDocRef, { status: 'validado', validatedBy: adminClaims.uid, validatedAt: FieldValue.serverTimestamp() });
        });

        const newStock = currentStock - cantidad;
        await materialRtdbRef.update({ cantidad: newStock });

        console.log(`Préstamo ${codigo} activado por ${adminClaims.uid}. Stock de ${materialId} actualizado a ${newStock}.`);
        
        revalidatePath('/admin/scan');

        return { success: true, message: '¡Préstamo activado con éxito!' };

    } catch (error: any) {
        console.error("Error en activatePrestamoAction:", error);
        return { success: false, message: error.message || 'Error interno del servidor.' };
    }
}
