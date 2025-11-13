
import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
// INCORRECTO: import { createOrUpdateStudent } from "@/lib/firestore-operations";
// CORRECTO: Importa la función del lado del servidor que usa el Admin SDK
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
        token.id = user.id;
        token.rol = user.rol || "estudiante";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
      }
      return session;
    },
  },
  events: {
    // Usa la función del servidor en el evento signIn
    async signIn(message) {
      if (message.user.id && message.user.email) {
        try {
          // Llama a la función correcta del Admin SDK
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
