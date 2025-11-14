import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { createOrUpdateStudentServer } from "@/lib/firestore-operations-server";

// Helper para extraer el grupo del email.
const extractGrupoFromEmail = (email: string | null | undefined): string | null => {
  if (!email) return null;
  // La regex busca correos de alumnos de la UACJ.
  const match = email.match(/^al\.(.+?)\d+@alumnos\.uacj\.mx$/);
  return match ? match[1].toUpperCase() : null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
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
    async signIn({ user }) {
      const email = user.email;
      if (email && (email.endsWith("@alumnos.uacj.mx") || email.endsWith("@ulsaneza.edu.mx"))) {
        return true;
      }
      console.log(`Sign-in denegado para el correo: ${user.email}`);
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
    async signIn(message) {
      const user = message.user; // ✅ Corregido: ahora usamos message.user
      if (user.id && user.email) {
        try {
          const grupo = extractGrupoFromEmail(user.email);
          await createOrUpdateStudentServer({
            id: user.id,
            name: user.name ?? null, // ✅ user.name existe aquí
            email: user.email,
            image: user.image ?? null, // ✅ user.image existe aquí
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
