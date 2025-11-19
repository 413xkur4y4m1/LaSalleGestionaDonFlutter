
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // Correcto: Solo adminDb de aquí
import { getRtdb } from '@/lib/firestore-operations-server'; // Correcto: getRtdb viene de aquí
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

// La función verifyAdminSession se mantiene igual
async function verifyAdminSession(sessionCookie: string) {
    try {
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
        const adminDocRef = adminDb.collection('admins').doc(decodedClaims.uid);
        const adminDoc = await adminDocRef.get();
        if (adminDoc.exists) {
            return decodedClaims;
        }
        return null;
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

    const rtdb = getRtdb();

    try {
        const body = await request.json();
        const { codigo } = body;

        if (!codigo) {
            return NextResponse.json({ message: "El código QR es requerido." }, { status: 400 });
        }

        const qrDocRef = adminDb.collection('qrs').doc(codigo);
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

        const prestamoRef = adminDb.collection('Estudiantes').doc(qrData.studentUid).collection('Prestamos').doc(qrData.operationId);
        const prestamoDoc = await prestamoRef.get();

        if (!prestamoDoc.exists) {
            return NextResponse.json({ message: `Error crítico: El préstamo asociado al QR no existe.` }, { status: 500 });
        }
        
        const prestamoData = prestamoDoc.data();
        // Asumimos que el préstamo SÍ guarda el materialId. Si no, habría que añadirlo.
        const { materialId, cantidad } = prestamoData || {};

        if (!materialId) {
            return NextResponse.json({ message: `El préstamo no tiene un materialId asociado.` }, { status: 500 });
        }

        const materialRtdbRef = rtdb.ref(`materiales/${materialId}`);
        const materialSnapshot = await materialRtdbRef.once('value');
        const currentStock = materialSnapshot.val()?.cantidad || 0;

        if (currentStock < cantidad) {
            return NextResponse.json({ message: `Stock insuficiente para este material. Disponible: ${currentStock}, Solicitado: ${cantidad}` }, { status: 409 });
        }

        await adminDb.runTransaction(async (transaction) => {
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

        const newStock = currentStock - cantidad;
        await materialRtdbRef.update({ cantidad: newStock });
        
        console.log(`Préstamo ${codigo} activado por ${adminClaims.uid}. Stock de ${materialId} actualizado a ${newStock}.`);

        return NextResponse.json({ message: "¡Préstamo activado con éxito!" });

    } catch (error) {
        console.error("Error fatal en /api/prestamos/activate:", error);
        return NextResponse.json({ message: "Error interno del servidor al activar el préstamo." }, { status: 500 });
    }
}
