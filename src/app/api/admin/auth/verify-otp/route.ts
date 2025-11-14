
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Verifies a one-time password (OTP) for admin login.
 */
export async function POST(request: Request) {
    console.log("API /api/admin/auth/verify-otp HIT!");

    try {
        const body = await request.json();
        const { adminId, otp } = body;

        if (!adminId || !otp) {
            return NextResponse.json({ message: "El ID de administrador y el código OTP son requeridos." }, { status: 400 });
        }

        // 1. Buscar el código OTP en Firestore
        const now = Timestamp.now();
        const otpQuery = adminDb.collection('admin_auth_codes')
            .where('adminId', '==', adminId)
            .where('otp', '==', otp)
            .where('expiresAt', '>', now)
            .where('used', '==', false)
            .limit(1);
        
        const otpSnapshot = await otpQuery.get();

        if (otpSnapshot.empty) {
            console.log(`Verification failed for admin '${adminId}'. OTP '${otp}' is invalid, expired, or already used.`);
            return NextResponse.json({ message: "Código incorrecto, expirado o ya utilizado." }, { status: 401 }); // 401 Unauthorized
        }

        // 2. Marcar el código como usado en una transacción para asegurar atomicidad
        const otpDoc = otpSnapshot.docs[0];
        await otpDoc.ref.update({ used: true });
        
        console.log(`Verification successful for admin '${adminId}'. OTP document ${otpDoc.id} has been marked as used.`);

        // 3. Generar sesión (simulado por ahora)
        // En una aplicación real, aquí se crearía un JWT o una cookie de sesión.
        // El cliente simplemente confía en esta respuesta para redirigir.

        return NextResponse.json({ 
            message: "¡Acceso concedido! Bienvenido.",
            // Podríamos devolver información del admin si fuera necesario en el frontend
            admin: {
                id: adminId,
            }
        });

    } catch (error) {
        console.error("Error en verify-otp:", error);
        return NextResponse.json({ message: "Error interno del servidor al verificar el código." }, { status: 500 });
    }
}
