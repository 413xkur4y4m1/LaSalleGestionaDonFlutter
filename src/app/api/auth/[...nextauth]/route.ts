import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      tenantId: process.env.TENANT_ID!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };