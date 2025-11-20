export const runtime = 'nodejs'; 
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import { sendAdminCredentials } from '@/lib/emailService'; 
import { randomBytes } from 'crypto';

// Función de verificación de admin
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

// Generar ID único de administrador
function generateAdminOTAccount(): string {
    const prefix = 'ADM';
    const randomPart = randomBytes(6).toString('hex').toUpperCase();
    return `${prefix}${randomPart}`;
}

// Generar contraseña temporal segura
function generateTemporaryPassword(): string {
    return randomBytes(12).toString('base64').slice(0, 16);
}

export async function POST(request: Request) {
    // 1. --- Verificación de Sesión de Administrador ---
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
        return NextResponse.json({ 
            message: "No autorizado: Sesión no proporcionada." 
        }, { status: 401 });
    }

    const adminClaims = await verifyAdminSession(sessionCookie);

    if (!adminClaims) {
        return NextResponse.json({ 
            message: "No autorizado: Solo un administrador puede realizar esta acción." 
        }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ 
                message: "El correo electrónico es requerido." 
            }, { status: 400 });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ 
                message: "Formato de correo electrónico inválido." 
            }, { status: 400 });
        }

        // 2. --- Verificar que el correo no esté ya registrado ---
        const existingAdminQuery = await adminDb
            .collection('admins')
            .where('correo', '==', email)
            .limit(1)
            .get();

        if (!existingAdminQuery.empty) {
            return NextResponse.json({ 
                message: `El correo "${email}" ya está registrado como administrador.` 
            }, { status: 409 });
        }

        // 3. --- Generar credenciales ---
        const adminOTAccount = generateAdminOTAccount();
        const temporaryPassword = generateTemporaryPassword();

        // 4. --- Crear usuario en Firebase Auth ---
        let userRecord;
        try {
            userRecord = await getAuth().createUser({
                email: email,
                password: temporaryPassword,
                emailVerified: false,
                displayName: `Admin ${adminOTAccount}`,
            });
        } catch (authError: any) {
            if (authError.code === 'auth/email-already-exists') {
                return NextResponse.json({ 
                    message: `El correo "${email}" ya está en uso en el sistema de autenticación.` 
                }, { status: 409 });
            }
            throw authError;
        }

        // 5. --- Crear documento en Firestore con el AdminOTAccount como ID ---
        await adminDb.collection('admins').doc(adminOTAccount).set({
            correo: email,
            fechaCreacion: Timestamp.now(),
            rol: 'admin',
            fotoPerfil: '',
            firebaseUid: userRecord.uid, // Guardamos referencia al UID de Firebase Auth
        });

        // 6. --- Enviar credenciales por email ---
        try {
            await sendAdminCredentials(email, adminOTAccount, temporaryPassword);
        } catch (emailError) {
            console.error('Error al enviar email:', emailError);
            // Si falla el email, eliminamos el usuario creado
            await getAuth().deleteUser(userRecord.uid);
            await adminDb.collection('admins').doc(adminOTAccount).delete();
            
            return NextResponse.json({ 
                message: "Error al enviar el correo con las credenciales. Por favor, verifica la configuración de email." 
            }, { status: 500 });
        }

        console.log(`Nuevo admin creado: ${adminOTAccount} (${email}) por ${adminClaims.email}`);

        return NextResponse.json({ 
            message: `¡Administrador creado exitosamente! Se han enviado las credenciales a ${email}`,
            adminOTAccount: adminOTAccount
        });

    } catch (error: any) {
        console.error("Error fatal en /api/admins:", error);
        return NextResponse.json({ 
            message: "Error interno del servidor al procesar la solicitud." 
        }, { status: 500 });
    }
}