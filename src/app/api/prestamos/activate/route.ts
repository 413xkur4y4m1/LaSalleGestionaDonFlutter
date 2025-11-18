
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';

// --- FIX: Función de verificación de admin actualizada ---
// Ahora consulta Firestore para validar si el UID del usuario está en la colección 'admins'
async function verifyAdminSession(sessionCookie: string) {
    try {
        // 1. Verificar la cookie de sesión para obtener los datos del usuario
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
        
        // 2. Consultar si el UID del usuario existe como documento en la colección 'admins'
        const adminDocRef = adminDb.collection('admins').doc(decodedClaims.uid);
        const adminDoc = await adminDocRef.get();

        // 3. Si el documento existe, es un admin válido.
        if (adminDoc.exists) {
            return decodedClaims; // Devuelve los datos del usuario admin
        }

        // Si no existe, no es un admin.
        return null;
    } catch (error) {
        // La cookie es inválida o ha expirado
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

    try {
        const body = await request.json();
        const { codigo } = body;

        if (!codigo) {
            return NextResponse.json({ message: "El código del préstamo es requerido." }, { status: 400 });
        }

        const prestamosRef = adminDb.collection('prestamos');
        const q = prestamosRef.where('loanCode', '==', codigo).limit(1);
        
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return NextResponse.json({ message: `Préstamo con código "${codigo}" no encontrado.` }, { status: 404 });
        }

        const prestamoDoc = querySnapshot.docs[0];
        const prestamoData = prestamoDoc.data();

        if (prestamoData.estado !== 'pendiente') {
            const estadoActual = prestamoData.estado.charAt(0).toUpperCase() + prestamoData.estado.slice(1);
            return NextResponse.json({ message: `Este préstamo ya fue activado o procesado. Estado actual: ${estadoActual}.` }, { status: 409 });
        }

        await prestamoDoc.ref.update({
            estado: 'activo',
            activatedBy: adminClaims.uid,
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
