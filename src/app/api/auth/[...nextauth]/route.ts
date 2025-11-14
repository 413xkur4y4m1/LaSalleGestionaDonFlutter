
import NextAuth from "next-auth";
// Importamos la configuración desde el nuevo archivo centralizado.
import { authOptions } from "@/auth";

// Creamos el manejador de NextAuth pasándole la configuración.
const handler = NextAuth(authOptions);

// Exportamos el manejador para los métodos GET y POST, como exige Next.js.
export { handler as GET, handler as POST };
