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
    // 1. signIn Callback: Controls if a user is allowed to sign in.
    // This is the primary security check.
    async signIn({ user }) {
      // It allows sign-in only if the email belongs to the correct domain.
      if (user.email && user.email.endsWith("@ulsaneza.edu.mx")) {
        return true; // The user is allowed to proceed.
      }
      // If the email does not match, it denies access and the process stops here.
      console.log(`Sign-in denied for email: ${user.email}`);
      return false; 
    },

    // 2. JWT Callback: Populates the JWT token with custom data.
    // This runs after signIn and before the session is created.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Assigns a default role if not present.
        token.rol = user.rol || "estudiante";
      }
      return token;
    },
    
    // 3. Session Callback: Enriches the client-side session object.
    // Makes the custom data from the token available to the client.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
      }
      return session;
    },
  },
  events: {
    // 4. signIn Event: Runs AFTER a successful sign-in.
    // This is the perfect place for side effects that should not block the login.
    async signIn(message) {
      if (message.user.id && message.user.email) {
        try {
          // Creates or updates the user in Firestore after they have successfully authenticated.
          await createOrUpdateStudent(message.user);
        } catch (error) {
          console.error("Error in createOrUpdateStudent event:", error);
        }
      }
    },
  },
  pages: {
    // If sign-in is required or an error occurs, redirect to the homepage.
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
