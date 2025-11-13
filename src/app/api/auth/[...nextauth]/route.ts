
import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { createOrUpdateStudentServer } from "@/lib/firestore-operations-server";

const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      tenantId: process.env.TENANT_ID!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email && user.email.endsWith("@ulsaneza.edu.mx")) {
        return true;
      }
      console.log(`Sign-in denegado para el correo: ${user.email}`);
      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        // Al iniciar sesión, pasamos los datos del usuario al token
        token.id = user.id;
        token.rol = user.rol || "estudiante";
        token.grupo = user.grupo; // <-- AÑADIDO: Pasamos el grupo al token
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Desde el token, pasamos los datos a la sesión del cliente
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
        session.user.grupo = token.grupo as string; // <-- AÑADIDO: Pasamos el grupo a la sesión
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      if (message.user.id && message.user.email) {
        try {
          await createOrUpdateStudentServer(message.user);
        } catch (error) {
          console.error("Error en createOrUpdateStudentServer:", error);
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
