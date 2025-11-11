import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { createOrUpdateStudent } from "@/lib/firestore-operations";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Validate email ends with @lasalle.mx
      if (user.email && user.email.endsWith("@lasalle.mx")) {
        // Call createOrUpdateStudent to handle Firestore operations
        if (user.id) {
          await createOrUpdateStudent(user);
        }
        return true;
      }
      return false;
    },
    async session({ session, token }) {
      // Add custom fields (id, rol) to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      if (session.user && token.rol) {
        session.user.rol = token.rol as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Keep information in token
      if (user) {
        token.id = user.id;
        token.rol = user.rol || "estudiante"; // Assign default role if not present
      }
      return token;
    },
  },
  events: {
    async signIn(message) {
      if (message.user.id) {
        await createOrUpdateStudent(message.user);
      }
    },
  },
  pages: {
    signIn: "/", // Custom sign-in page handled by the landing page
    error: "/",   // Custom error page handled by the landing page
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };