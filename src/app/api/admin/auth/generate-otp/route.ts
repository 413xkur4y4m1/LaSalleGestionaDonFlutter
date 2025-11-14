
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { sendAdminOtpEmail } from '@/lib/email-server';

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

        // --- FIX: Asegurar que el OTP siempre tenga 5 dígitos ---
        const otp = Math.floor(10000 + Math.random() * 90000).toString();

        const expiresAt = Timestamp.fromMillis(Date.now() + 15 * 60 * 1000);

        await adminDb.collection('admin_auth_codes').doc().set({
            adminId,
            otp,
            createdAt: Timestamp.now(),
            expiresAt,
            used: false
        });

        const emailResult = await sendAdminOtpEmail(email, otp);

        if (!emailResult.success) {
            console.error("CRITICAL: Fallo en el envío de correo.", {
                adminId: adminId,
                email: email,
                errorDetails: (emailResult.error as any)?.message || emailResult.error
            });
            return NextResponse.json({ message: "El servicio de correo no respondió. Revisa las credenciales de correo en tu .env.local" }, { status: 502 });
        }

        return NextResponse.json({ 
            message: "Se ha enviado un código de acceso a tu correo.", 
            email: email 
        });

    } catch (error) {
        console.error("Error fatal en generate-otp:", error);
        return NextResponse.json({ message: "Error interno del servidor." }, { status: 500 });
    }
}
