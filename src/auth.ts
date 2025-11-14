
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { createOrUpdateStudentServer } from "@/lib/firestore-operations-server";

// Helper para extraer el grupo del email.
const extractGrupoFromEmail = (email: string | null | undefined): string | null => {
    if (!email) return null;
    // La regex busca correos de alumnos de la UACJ.
    const match = email.match(/^al\\.(.+?)\\d+@alumnos\\.uacj\\.mx$/);
    return match ? match[1].toUpperCase() : null;
};

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            // CORRECCIÓN: Usamos las variables de entorno correctas del archivo .env.local
            clientId: process.env.CLIENT_ID!,
            clientSecret: process.env.CLIENT_SECRET!,
            tenantId: process.env.TENANT_ID!,
            authorization: {
                params: {
                    scope: "openid profile user.Read email",
                },
            },
        }),
    ],
    callbacks: {
        // Callback para verificar si el usuario tiene permiso para iniciar sesión.
        async signIn({ user }) {
            const email = user.email;
            // Solo permite el acceso a correos de alumnos de la UACJ o ULSA Neza.
            if (email && (email.endsWith("@alumnos.uacj.mx") || email.endsWith("@ulsaneza.edu.mx"))) {
                return true;
            }
            console.log(`Sign-in denegado para el correo: ${user.email}`);
            // Si el correo no es válido, se deniega el acceso.
            return false;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.rol = "estudiante";
                token.grupo = extractGrupoFromEmail(user.email ?? null) ?? undefined;

            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.rol = token.rol as string;
                (session.user as any).grupo = token.grupo ?? null;
            }
            return session;
        },
    },
    events: {
        // Evento que se dispara tras un inicio de sesión exitoso.
        async signIn(message) {
            if (message.user.id && message.user.email) {
                try {
                    const grupo = extractGrupoFromEmail(message.user.email);
                    // IMPORTANTE: Se pasa un objeto limpio para evitar errores de serialización.
                    await createOrUpdateStudentServer({
                        id: message.user.id,
                        name: message.user.name,
                        email: message.user.email,
                        image: message.user.image,
                        rol: "estudiante",
                        grupo: grupo,
                    });
                } catch (e) {
                    console.error("Error en createOrUpdateStudentServer:", e);
                }
            }
        },
    },
    pages: {
        signIn: "/",
        error: "/",
    },
    session: {
        strategy: "jwt",
    },
};
