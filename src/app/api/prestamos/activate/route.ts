
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';

// Función para verificar la sesión del admin desde el lado del servidor
async function verifyAdminSession(sessionCookie: string) {
    try {
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
        
        // Verificamos si el usuario tiene el claim de admin
        if (decodedClaims.role !== 'admin') {
            return null;
        }
        return decodedClaims;
    } catch (error) {
        return null;
    }
}

export async function POST(request: Request) {
    console.log("API /api/prestamos/activate HIT!");

    // 1. --- Verificación de Sesión de Administrador ---
    const cookieStore = await cookies(); // <-- FIX: Añadido await
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ message: "No autorizado: No hay sesión." }, { status: 401 });
    }

    const adminClaims = await verifyAdminSession(sessionCookie);

    if (!adminClaims) {
        return NextResponse.json({ message: "No autorizado: La sesión no es de un administrador válido." }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { codigo } = body;

        if (!codigo) {
            return NextResponse.json({ message: "El código del préstamo es requerido." }, { status: 400 });
        }

        // 2. --- Búsqueda del Préstamo en Firestore ---
        const prestamosRef = adminDb.collection('prestamos');
        const q = prestamosRef.where('loanCode', '==', codigo).limit(1);
        
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return NextResponse.json({ message: `Préstamo con código "${codigo}" no encontrado.` }, { status: 404 });
        }

        const prestamoDoc = querySnapshot.docs[0];
        const prestamoData = prestamoDoc.data();

        // 3. --- Validación del Estado del Préstamo ---
        if (prestamoData.estado !== 'pendiente') {
            const estadoActual = prestamoData.estado.charAt(0).toUpperCase() + prestamoData.estado.slice(1);
            return NextResponse.json({ message: `Este préstamo ya fue activado o procesado. Estado actual: ${estadoActual}.` }, { status: 409 }); // 409 Conflict
        }

        // 4. --- Activación y Actualización del Documento ---
        await prestamoDoc.ref.update({
            estado: 'activo',
            activatedBy: adminClaims.uid, // Guardamos el UID del admin que lo activó
            activatedAt: Timestamp.now()
        });
        
        console.log(`Préstamo ${codigo} activado exitosamente por admin ${adminClaims.uid}`);

        return NextResponse.json({ 
            message: "¡Préstamo activado con éxito!",
            prestamoId: prestamoDoc.id
        });

    } catch (error) {
        console.error("Error fatal en /api/prestamos/activate:", error);
        return NextResponse.json({ message: "Error interno del servidor al activar el préstamo." }, { status: 500 });
    }
}
