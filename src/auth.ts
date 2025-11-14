
import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import {
  createOrUpdateStudentServer,
  getStudentById,
} from "@/lib/firestore-operations-server";

const extractGrupoFromEmail = (email: string | null | undefined): string | null => {
  if (!email) return null;
  const match = email.match(/^al\.(.+?)\d+@alumnos\.uacj\.mx$/);
  return match ? match[1].toUpperCase() : null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      tenantId: process.env.TENANT_ID!,
      authorization: { params: { scope: "openid profile user.Read email" } },
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

    // ✅ --- EL NUEVO CEREBRO DE LA AUTENTICACIÓN ---
    async jwt({ token, user, trigger }) {
      // ---- Se ejecuta solo en el LOGIN inicial ----
      if (user) {
        console.log("JWT: Login inicial detectado.");
        // Llamamos a la función que crea/actualiza en la DB AQUI MISMO.
        // Esto evita las carreras de código.
        await createOrUpdateStudentServer({
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
          rol: "estudiante",
          grupo: extractGrupoFromEmail(user.email),
        });

        // Ahora leemos desde la DB para asegurarnos de tener los datos correctos.
        const studentData = await getStudentById(user.id);

        token.id = user.id;
        token.rol = "estudiante";
        token.grupo = studentData?.grupo ?? undefined;
        console.log("JWT: Token inicial creado", token);
        return token;
      }

      // ---- Se ejecuta cuando llamas `update()` o en cada navegación ----
      // Si el token no tiene grupo, o si forzamos la actualización, vamos a la DB.
      if (trigger === "update" || !token.grupo) {
        console.log(`JWT: Refrescando token. Trigger: ${trigger}, Grupo actual: ${token.grupo}`);
        const studentData = await getStudentById(token.id as string);
        if (studentData?.grupo) {
          console.log(`JWT: Grupo '${studentData.grupo}' encontrado en DB. Token actualizado.`);
          token.grupo = studentData.grupo;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // La sesión solo refleja lo que el token (ya verificado) le dice.
      session.user.id = token.id as string;
      session.user.rol = token.rol as string;
      (session.user as any).grupo = token.grupo ?? null;
      return session;
    },
  },

  // ❌ --- ELIMINAMOS EL BLOQUE DE EVENTOS --- 
  // Su lógica ahora vive en el callback `jwt` para evitar carreras.
  events: {},

  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
};
