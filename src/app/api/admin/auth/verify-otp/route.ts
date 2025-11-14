import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Verifica un código OTP y, si es válido, lo marca como usado.
 * Esta versión simplifica la consulta a Firestore para evitar requerir un índice compuesto.
 */
export async function POST(request: Request) {
    console.log("API /api/admin/auth/verify-otp HIT!");

    try {
        const body = await request.json();
        const { adminId, otp } = body;

        if (!adminId || !otp) {
            return NextResponse.json({ message: "El ID de administrador y el código OTP son requeridos." }, { status: 400 });
        }

        // 1. Consulta simplificada: busca solo por adminId y otp.
        // Esto evita el error FAILED_PRECONDITION que requiere un índice compuesto.
        const otpQuery = adminDb.collection('admin_auth_codes')
            .where('adminId', '==', adminId)
            .where('otp', '==', otp)
            .limit(1);
        
        const otpSnapshot = await otpQuery.get();

        if (otpSnapshot.empty) {
            console.log(`Verification failed for admin '${adminId}'. OTP '${otp}' not found.`);
            return NextResponse.json({ message: "Código incorrecto." }, { status: 401 });
        }

        const otpDoc = otpSnapshot.docs[0];
        const otpData = otpDoc.data();
        const now = Timestamp.now();

        // 2. Verificación de las condiciones en el código de la API, no en la consulta.
        if (otpData.used) {
            console.log(`Verification failed for admin '${adminId}'. OTP '${otp}' was already used.`);
            return NextResponse.json({ message: "Este código ya fue utilizado." }, { status: 401 });
        }

        if (now.toMillis() > otpData.expiresAt.toMillis()) {
            console.log(`Verification failed for admin '${adminId}'. OTP '${otp}' has expired.`);
            return NextResponse.json({ message: "El código ha expirado." }, { status: 401 });
        }

        // 3. Si todas las condiciones pasan, marcamos el código como usado.
        await otpDoc.ref.update({ used: true });
        
        console.log(`Verification successful for admin '${adminId}'. OTP document ${otpDoc.id} has been marked as used.`);

        // 4. Simulación de creación de sesión.
        // En una app real, aquí se crearía un JWT o una cookie.
        return NextResponse.json({ 
            message: "¡Acceso concedido! Bienvenido.",
            redirectUrl: '/admin/dashboard' // URL a la que redirigir en el frontend
        });

    } catch (error) {
        console.error("Error en verify-otp:", error);
        return NextResponse.json({ message: "Error interno del servidor al verificar el código." }, { status: 500 });
    }
}
