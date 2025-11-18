
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

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

export async function GET(request: Request) {
    console.log("API /api/prestamos/details HIT!");

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
        const { searchParams } = new URL(request.url);
        const codigo = searchParams.get('codigo');

        if (!codigo) {
            return NextResponse.json({ message: "El código del préstamo es requerido como parámetro." }, { status: 400 });
        }

        const prestamosRef = adminDb.collection('prestamos');
        const q = prestamosRef.where('loanCode', '==', codigo).limit(1);
        
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return NextResponse.json({ message: `Préstamo con código "${codigo}" no encontrado.` }, { status: 404 });
        }

        const prestamoDoc = querySnapshot.docs[0];
        const prestamoData = prestamoDoc.data();

        return NextResponse.json({
            id: prestamoDoc.id,
            loanCode: prestamoData.loanCode,
            studentName: prestamoData.studentName,
            materialNombre: prestamoData.materialNombre,
            cantidad: prestamoData.cantidad,
            estado: prestamoData.estado,
            fechaSolicitud: prestamoData.createdAt.toDate(),
        });

    } catch (error) {
        console.error("Error fatal en /api/prestamos/details:", error);
        return NextResponse.json({ message: "Error interno del servidor al obtener los detalles del préstamo." }, { status: 500 });
    }
}
