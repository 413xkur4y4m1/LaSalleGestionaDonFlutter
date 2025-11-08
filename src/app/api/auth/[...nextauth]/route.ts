import NextAuth from "next-auth";
import { authOptions } from "./authOptions";
 // ajusta la ruta según tu estructura

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
