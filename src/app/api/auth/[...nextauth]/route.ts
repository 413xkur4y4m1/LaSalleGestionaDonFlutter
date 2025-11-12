import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { createOrUpdateStudentServer } from "@/lib/firestore-operations-server";


export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      tenantId: process.env.TENANT_ID!,
    }),
  ],
  callbacks: {
    // 1. signIn Callback: controla si un usuario puede iniciar sesión
    async signIn({ user }) {
      // Permite solo correos institucionales
      if (user.email && user.email.endsWith("@ulsaneza.edu.mx")) {
        return true;
      }
      console.log(`Sign-in denegado para el correo: ${user.email}`);
      return false;
    },

    // 2. JWT Callback: agrega datos personalizados al token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol || "estudiante";
      }
      return token;
    },

    // 3. Session Callback: agrega datos del token a la sesión
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
      }
      return session;
    },
  },
  events: {
    // 4. signIn Event: se ejecuta después de un inicio de sesión exitoso
    async signIn(message) {
      if (message.user.id && message.user.email) {
        try {
          await createOrUpdateStudentServer(message.user);

        } catch (error) {
          console.error("Error en createOrUpdateStudent:", error);
        }
      }
    },
  },
  pages: {
    signIn: "/", // Página de inicio de sesión
    error: "/",  // Página de error
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
