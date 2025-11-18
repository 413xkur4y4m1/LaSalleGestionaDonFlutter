
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';

// Función de verificación de admin (reutilizada de los otros endpoints)
async function verifyAdminSession(sessionCookie: string) {
    try {
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
        const adminDoc = await adminDb.collection('admins').doc(decodedClaims.uid).get();
        if (adminDoc.exists) {
            return decodedClaims;
        }
        return null;
    } catch (error) {
        return null;
    }
}

export async function POST(request: Request) {
    // 1. --- Verificación de Sesión de Administrador ---
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ message: "No autorizado: Sesión no proporcionada." }, { status: 401 });
    }

    const adminClaims = await verifyAdminSession(sessionCookie);

    if (!adminClaims) {
        return NextResponse.json({ message: "No autorizado: Solo un administrador puede realizar esta acción." }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ message: "El correo electrónico es requerido." }, { status: 400 });
        }

        // 2. --- Buscar al usuario por email en Firebase Auth ---
        let userRecord;
        try {
            userRecord = await getAuth().getUserByEmail(email);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                return NextResponse.json({ message: `Usuario con email "${email}" no encontrado.` }, { status: 404 });
            }
            throw error; // Otros errores de Firebase Auth
        }

        const targetUid = userRecord.uid;

        // 3. --- Verificar si el usuario ya es un admin ---
        const newAdminDocRef = adminDb.collection('admins').doc(targetUid);
        const newAdminDoc = await newAdminDocRef.get();

        if (newAdminDoc.exists) {
            return NextResponse.json({ message: `El usuario "${email}" ya es un administrador.` }, { status: 409 }); // 409 Conflict
        }

        // 4. --- Crear el documento de admin en Firestore ---
        await newAdminDocRef.set({
            email: userRecord.email,
            displayName: userRecord.displayName || 'Sin nombre',
            addedBy: adminClaims.uid, // UID del admin que lo agregó
            addedByEmail: adminClaims.email,
            createdAt: Timestamp.now()
        });

        console.log(`Usuario ${email} (UID: ${targetUid}) fue promovido a admin por ${adminClaims.email}`);

        return NextResponse.json({ message: `¡Usuario ${email} ha sido promovido a administrador con éxito!` });

    } catch (error: any) {
        console.error("Error fatal en /api/admins:", error);
        // Distinguir errores de cliente de los de servidor
        if (error.code?.startsWith('auth/')) {
            return NextResponse.json({ message: `Error de autenticación: ${error.message}` }, { status: 400 });
        }
        return NextResponse.json({ message: "Error interno del servidor al procesar la solicitud." }, { status: 500 });
    }
}
