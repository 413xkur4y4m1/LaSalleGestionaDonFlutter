
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

// Función para verificar la sesión del admin desde el lado del servidor
async function verifyAdminSession(sessionCookie: string) {
    try {
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
        if (decodedClaims.role !== 'admin') {
            return null;
        }
        return decodedClaims;
    } catch (error) {
        return null;
    }
}

export async function GET(request: Request) {
    console.log("API /api/prestamos/details HIT!");

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
        const { searchParams } = new URL(request.url);
        const codigo = searchParams.get('codigo');

        if (!codigo) {
            return NextResponse.json({ message: "El código del préstamo es requerido como parámetro." }, { status: 400 });
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

        // 3. --- Devolver los datos del préstamo ---
        // Devolvemos los datos relevantes para que el admin confirme
        return NextResponse.json({
            id: prestamoDoc.id,
            loanCode: prestamoData.loanCode,
            studentName: prestamoData.studentName, // Asumiendo que guardas el nombre
            materialNombre: prestamoData.materialNombre,
            cantidad: prestamoData.cantidad,
            estado: prestamoData.estado,
            fechaSolicitud: prestamoData.createdAt.toDate(), // Convertir Timestamp a Date
        });

    } catch (error) {
        console.error("Error fatal en /api/prestamos/details:", error);
        return NextResponse.json({ message: "Error interno del servidor al obtener los detalles del préstamo." }, { status: 500 });
    }
}

