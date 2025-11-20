
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getDb, getRtdb } from '@/lib/firestore-operations-server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';

// --- Función de Verificación de Admin ---
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

// --- ACCIÓN: Obtener Detalles del Préstamo (CORREGIDA) ---
export async function getPrestamoDetailsAction(codigo: string) {
    const db = getDb();
    try {
        const qrDocRef = db.collection('qrs').doc(codigo);
        const qrDoc = await qrDocRef.get();

        if (!qrDoc.exists) {
            return { success: false, message: `Código QR "${codigo}" no encontrado.` };
        }
        const qrData = qrDoc.data();

        if (!qrData || qrData.operationType !== 'prestamos' || !qrData.studentUid || !qrData.operationId) {
            return { success: false, message: 'El código QR es inválido o no está asociado a un préstamo.' };
        }

        const prestamoRef = db.collection('Estudiantes').doc(qrData.studentUid).collection('Prestamos').doc(qrData.operationId);
        const prestamoDoc = await prestamoRef.get();

        if (!prestamoDoc.exists) {
            return { success: false, message: 'Error crítico: No se encontró el documento de préstamo asociado al QR.' };
        }
        const prestamoData = prestamoDoc.data();
         if (!prestamoData) {
            return { success: false, message: 'El documento del préstamo está vacío.' };
        }

        // ✅ CORRECCIÓN: Buscar en la colección 'Estudiantes' y usar el campo 'nombre'
        const studentRef = db.collection('Estudiantes').doc(qrData.studentUid);
        const studentDoc = await studentRef.get();
        const studentName = studentDoc.exists ? studentDoc.data()?.nombre : 'Estudiante Desconocido';

        const details = {
            id: prestamoDoc.id,
            loanCode: prestamoData.codigo,
            studentName: studentName,
            materialNombre: prestamoData.nombreMaterial,
            cantidad: prestamoData.cantidad,
            estado: prestamoData.estado,
            fechaSolicitud: prestamoData.fechaSolicitud.toDate().toISOString(),
        };

        return { success: true, data: details };

    } catch (error: any) {
        console.error("Error en getPrestamoDetailsAction:", error);
        return { success: false, message: error.message || 'Error interno del servidor al buscar detalles.' };
    }
}


// --- ACCIÓN: Activar Préstamo (COMPLETA Y CORREGIDA) ---
export async function activatePrestamoAction(codigo: string) {
    const sessionCookie = (await cookies()).get('__session')?.value;
    if (!sessionCookie) {
        return { success: false, message: 'No autorizado: No hay sesión.' };
    }
    const adminClaims = await verifyAdminSession(sessionCookie);
    if (!adminClaims) {
        return { success: false, message: 'No autorizado: La sesión no es de un administrador válido.' };
    }

    const db = getDb();
    const rtdb = getRtdb();

    try {
        // 1. Obtener datos del QR
        const qrDocRef = db.collection('qrs').doc(codigo);
        const qrDoc = await qrDocRef.get();

        if (!qrDoc.exists) {
            return { success: false, message: `Código QR "${codigo}" no encontrado.` };
        }

        const qrData = qrDoc.data();
        if (qrData?.status !== 'pendiente') {
            return { success: false, message: `Este QR ya fue procesado. Estado actual: ${qrData?.status}.` };
        }

        if (qrData.operationType !== 'prestamos' || !qrData.studentUid || !qrData.operationId) {
            return { success: false, message: `Este QR no es para una operación de préstamo válida.` };
        }

        // 2. Obtener datos del Préstamo original
        const prestamoRef = db.collection('Estudiantes').doc(qrData.studentUid).collection('Prestamos').doc(qrData.operationId);
        const prestamoDoc = await prestamoRef.get();

        if (!prestamoDoc.exists) {
            return { success: false, message: 'Error crítico: El préstamo asociado al QR no existe.' };
        }

        const prestamoData = prestamoDoc.data();
        const { materialId, cantidad } = prestamoData || {};
        if (!materialId || !cantidad) {
             return { success: false, message: 'El préstamo no tiene un materialId o cantidad válida para ser procesado.' };
        }

        // 3. ✅ LÓGICA DE INVENTARIO: Verificar y actualizar el stock en la Realtime Database
        const materialRtdbRef = rtdb.ref(`materiales/${materialId}`);
        
        const { committed, snapshot } = await materialRtdbRef.transaction((currentData) => {
            if (currentData === null) { return; }
            const currentStock = currentData.stock || 0;
            if (currentStock >= cantidad) {
                currentData.stock = currentStock - cantidad;
                return currentData;
            } else {
                return;
            }
        });

        if (!committed) {
            const currentStock = (await materialRtdbRef.once('value')).val()?.stock || 0;
            return { success: false, message: `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${cantidad}. No se pudo activar el préstamo.` };
        }

        // 4. ✅ Si la transacción de stock fue exitosa, actualizamos los documentos en Firestore
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

        const newStock = snapshot.val()?.stock;
        console.log(`Préstamo ${codigo} activado por ${adminClaims.uid}. Stock de ${materialId} actualizado a ${newStock}.`);
        
        revalidatePath('/admin/scan');
        return { success: true, message: '¡Préstamo activado con éxito!' };

    } catch (error: any) {
        console.error("Error en activatePrestamoAction:", error);
        if (error.code && error.message) {
            return { success: false, message: `Error de base de datos: ${error.message}` };
        }
        return { success: false, message: error.message || 'Error interno del servidor.' };
    }
}
