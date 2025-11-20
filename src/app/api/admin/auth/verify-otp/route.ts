import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Verifica un código OTP y crea una sesión de administrador.
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

        // 2. Verificación de las condiciones en el código de la API.
        if (otpData.used) {
            console.log(`Verification failed for admin '${adminId}'. OTP '${otp}' was already used.`);
            return NextResponse.json({ message: "Este código ya fue utilizado." }, { status: 401 });
        }

        if (now.toMillis() > otpData.expiresAt.toMillis()) {
            console.log(`Verification failed for admin '${adminId}'. OTP '${otp}' has expired.`);
            return NextResponse.json({ message: "El código ha expirado." }, { status: 401 });
        }

        // 3. Marcar el código como usado.
        await otpDoc.ref.update({ used: true });
        
        console.log(`Verification successful for admin '${adminId}'. OTP document ${otpDoc.id} has been marked as used.`);

        // 4. ✅ NUEVO: Crear cookie de sesión segura
        const nowMillis = Date.now();
        const sessionData = {
            uid: adminId,
            admin: true,
            createdAt: nowMillis,
            expiresAt: nowMillis + (5 * 24 * 60 * 60 * 1000) // 5 días
        };

        const cookieStore = await cookies();
        cookieStore.set('__session', Buffer.from(JSON.stringify(sessionData)).toString('base64'), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 5 * 24 * 60 * 60, // 5 días en segundos
            path: '/'
        });

        console.log(`Session cookie created for admin '${adminId}'`);

        return NextResponse.json({ 
            success: true,
            message: "¡Acceso concedido! Bienvenido.",
            redirectUrl: '/admin/dashboard'
        });

    } catch (error) {
        console.error("Error en verify-otp:", error);
        return NextResponse.json({ message: "Error interno del servidor al verificar el código." }, { status: 500 });
    }
}