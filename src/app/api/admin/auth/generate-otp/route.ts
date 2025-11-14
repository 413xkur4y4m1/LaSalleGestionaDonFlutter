
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { sendAdminOtpEmail } from '@/lib/email-server'; // ¡Importamos el poder de Azure!

/**
 * Generates a one-time password (OTP) and sends it to the admin's email.
 */
export async function POST(request: Request) {
    console.log("API /api/admin/auth/generate-otp HIT!");

    try {
        const body = await request.json();
        const { adminId } = body;

        if (!adminId) {
            return NextResponse.json({ message: "El ID de administrador es requerido." }, { status: 400 });
        }

        const adminRef = adminDb.collection('admins').doc(adminId);
        const adminDoc = await adminRef.get();

        if (!adminDoc.exists) {
            return NextResponse.json({ message: "La cuenta de administrador no existe." }, { status: 404 });
        }

        const adminData = adminDoc.data();
        const email = adminData?.correo;

        if (!email) {
            return NextResponse.json({ message: "La cuenta no tiene un correo electrónico asociado." }, { status: 500 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Timestamp.fromMillis(Date.now() + 15 * 60 * 1000);

        const otpRef = adminDb.collection('admin_auth_codes').doc();
        await otpRef.set({
            adminId,
            otp,
            createdAt: Timestamp.now(),
            expiresAt,
            used: false
        });

        // ¡FUEGO REAL! Llamamos a nuestro lanzallamas de Azure.
        const emailResult = await sendAdminOtpEmail(email, otp);

        if (!emailResult.success) {
            // Si el correo falla, no debemos bloquear al usuario, pero sí registrar el error.
            console.error("CRITICAL: Email sending failed. OTP was generated but not sent.", emailResult.error);
            // Podríamos decidir si devolver un error genérico o no. Por ahora, informamos al cliente.
            return NextResponse.json({ message: "No se pudo enviar el correo de autenticación. Por favor, inténtalo más tarde." }, { status: 502 }); // Bad Gateway, as we failed to communicate with an upstream service.
        }

        return NextResponse.json({ message: `Se ha enviado un código de acceso a ${email}.` });

    } catch (error) {
        console.error("Error en generate-otp:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
